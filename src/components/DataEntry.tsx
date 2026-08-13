import React, { useState } from 'react';
import { 
  PlusCircle, 
  FileUp, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  FileText,
  FileSpreadsheet,
  FileCode,
  Loader2,
  Save,
  Wand2
} from 'lucide-react';
import { VocabItem, GeneratedVocabItem } from '../types';

interface DataEntryProps {
  onAddVocab: (item: Omit<VocabItem, 'id' | 'createdAt' | 'srsLevel' | 'easeFactor' | 'intervalDays' | 'nextReview' | 'masteryScore'>) => void;
  onBulkAddVocab: (items: any[]) => void;
}

export const DataEntry: React.FC<DataEntryProps> = ({
  onAddVocab,
  onBulkAddVocab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'manual' | 'file' | 'ai'>('manual');

  // Manual Form State
  const [japanese, setJapanese] = useState('');
  const [kana, setKana] = useState('');
  const [romaji, setRomaji] = useState('');
  const [vietnamese, setVietnamese] = useState('');
  const [type, setType] = useState('Từ vựng');
  const [jlpt, setJlpt] = useState('N3');
  const [exampleJp, setExampleJp] = useState('');
  const [exampleVi, setExampleVi] = useState('');
  const [notes, setNotes] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // File Import State
  const [filePreview, setFilePreview] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');
  const [fileError, setFileError] = useState('');
  const [importSuccessMsg, setImportSuccessMsg] = useState('');

  // AI Generator State
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(5);
  const [aiJlpt, setAiJlpt] = useState('N3');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiGeneratedItems, setAiGeneratedItems] = useState<GeneratedVocabItem[]>([]);

  // Handle manual submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!japanese.trim() || !vietnamese.trim()) return;

    onAddVocab({
      japanese: japanese.trim(),
      kana: kana.trim(),
      romaji: romaji.trim(),
      vietnamese: vietnamese.trim(),
      type,
      jlpt,
      exampleJp: exampleJp.trim(),
      exampleVi: exampleVi.trim(),
      notes: notes.trim(),
    });

    setFormSuccess(true);
    setJapanese('');
    setKana('');
    setRomaji('');
    setVietnamese('');
    setExampleJp('');
    setExampleVi('');
    setNotes('');

    setTimeout(() => setFormSuccess(false), 3000);
  };

  // Handle file upload & UTF-8 parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileError('');
    setImportSuccessMsg('');

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const ext = file.name.split('.').pop()?.toLowerCase();

        if (ext === 'json') {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            setFilePreview(parsed);
          } else {
            throw new Error('Định dạng JSON phải là một mảng (Array) chứa các object.');
          }
        } else if (ext === 'csv') {
          const lines = text.split(/\r\n|\n/).filter((l) => l.trim());
          if (lines.length < 2) throw new Error('File CSV không có dữ liệu.');

          const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
          const rows: any[] = [];

          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
            if (cols.length >= 2) {
              rows.push({
                japanese: cols[0] || '',
                kana: cols[1] || '',
                romaji: cols[2] || '',
                vietnamese: cols[3] || cols[1] || '',
                type: cols[4] || 'Từ vựng',
                jlpt: cols[5] || 'N3',
                exampleJp: cols[6] || '',
                exampleVi: cols[7] || '',
                notes: cols[8] || '',
              });
            }
          }
          setFilePreview(rows);
        } else if (ext === 'txt') {
          const lines = text.split(/\r\n|\n/).filter((l) => l.trim() && !l.startsWith('#'));
          const rows = lines.map((line) => {
            const parts = line.split('|');
            return {
              japanese: parts[0]?.trim() || '',
              vietnamese: parts[1]?.trim() || '',
              kana: parts[2]?.trim() || '',
              type: parts[3]?.trim() || 'Từ vựng',
              jlpt: 'N3',
            };
          });
          setFilePreview(rows);
        } else {
          throw new Error('Chỉ hỗ trợ file .csv, .json, .txt UTF-8.');
        }
      } catch (err: any) {
        setFileError('Lỗi đọc file: ' + err.message);
        setFilePreview([]);
      }
    };

    reader.readAsText(file, 'UTF-8');
  };

  const handleConfirmFileImport = () => {
    if (filePreview.length === 0) return;
    onBulkAddVocab(filePreview);
    setImportSuccessMsg(`Đã nạp thành công ${filePreview.length} mục vào CSDL local!`);
    setFilePreview([]);
    setFileName('');
  };

  // Handle AI generation call
  const handleAIGenerate = async () => {
    if (!aiTopic.trim()) {
      setAiError('Vui lòng nhập chủ đề tiếng Nhật!');
      return;
    }

    setIsGenerating(true);
    setAiError('');
    setAiGeneratedItems([]);

    try {
      const res = await fetch('/api/ai/generate-vocab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic.trim(),
          count: aiCount,
          jlpt: aiJlpt,
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setAiGeneratedItems(data.items);
      } else {
        throw new Error(data.error || 'Lỗi server');
      }
    } catch (err: any) {
      setAiError('Lỗi sinh từ vựng AI: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmAIImport = () => {
    if (aiGeneratedItems.length === 0) return;
    onBulkAddVocab(aiGeneratedItems);
    setAiGeneratedItems([]);
    setAiTopic('');
    setFormSuccess(true);
    setTimeout(() => setFormSuccess(false), 3000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Tab Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 flex space-x-2">
        <button
          onClick={() => setActiveSubTab('manual')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'manual'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>1. Nhập Thủ Công (Form GUI)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('file')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'file'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileUp className="w-4 h-4" />
          <span>2. Nạp Qua File (CSV/JSON/TXT)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ai')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'ai'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>3. Sinh Bằng Gemini AI</span>
        </button>
      </div>

      {/* SUCCESS NOTIFICATION */}
      {formSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Đã ghi thành công mục từ vựng mới vào kho CSDL local!</span>
        </div>
      )}

      {/* SUBTAB 1: MANUAL FORM */}
      {activeSubTab === 'manual' && (
        <form onSubmit={handleManualSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            Thêm Thẻ Từ Vựng / Cấu Trúc Ngữ Pháp Mới
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Từ/Câu tiếng Nhật (Kanji/Kana) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={japanese}
                onChange={(e) => setJapanese(e.target.value)}
                required
                placeholder="VD: お疲れ様でした hoặc 確認する"
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Cách đọc Kana (Furigana)
              </label>
              <input
                type="text"
                value={kana}
                onChange={(e) => setKana(e.target.value)}
                placeholder="VD: おつかれさまでした"
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Phiên âm Romaji
              </label>
              <input
                type="text"
                value={romaji}
                onChange={(e) => setRomaji(e.target.value)}
                placeholder="VD: Otsukaresama deshita"
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nghĩa tiếng Việt chuẩn giao tiếp <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={vietnamese}
                onChange={(e) => setVietnamese(e.target.value)}
                required
                placeholder="VD: Anh/chị đã làm việc vất vả rồi"
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Phân loại từ</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="Từ vựng">Từ vựng chung</option>
                <option value="Động từ">Động từ</option>
                <option value="Tính từ">Tính từ</option>
                <option value="Mẫu ngữ pháp">Mẫu ngữ pháp</option>
                <option value="Cụm giao tiếp">Cụm giao tiếp</option>
                <option value="Mẫu câu nhờ vả">Mẫu câu nhờ vả</option>
                <option value="Khiêm nhường ngữ">Khiêm nhường ngữ</option>
                <option value="Từ vựng IT">Từ vựng IT Software</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Trình độ JLPT</label>
              <select
                value={jlpt}
                onChange={(e) => setJlpt(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="N5">N5 (Sơ cấp 1)</option>
                <option value="N4">N4 (Sơ cấp 2)</option>
                <option value="N3">N3 (Trung cấp 1)</option>
                <option value="N2">N2 (Trung cấp 2)</option>
                <option value="N1">N1 (Cao cấp)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Ví dụ thực tế tiếng Nhật</label>
            <input
              type="text"
              value={exampleJp}
              onChange={(e) => setExampleJp(e.target.value)}
              placeholder="VD: 今日も一日、お疲れ様でした。"
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Dịch câu ví dụ tiếng Việt</label>
            <input
              type="text"
              value={exampleVi}
              onChange={(e) => setExampleVi(e.target.value)}
              placeholder="VD: Cảm ơn anh chị vì một ngày làm việc vất vả."
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Ghi chú / Sắc thái văn phong</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Dùng phổ biến ở công ty Nhật khi kết thúc giờ làm việc."
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-indigo-600/30"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Vào Bộ Nhớ Local</span>
            </button>
          </div>
        </form>
      )}

      {/* SUBTAB 2: FILE IMPORT */}
      {activeSubTab === 'file' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white mb-2">Nạp Từ Tập Tin Máy Tính (UTF-8 Parsing)</h3>
          <p className="text-xs text-slate-400">
            Hỗ trợ nhập danh sách từ vựng số lượng lớn từ file CSV, JSON hoặc TXT với UTF-8 encoding.
          </p>

          <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-2xl p-8 text-center bg-slate-950/50 transition-colors relative">
            <input
              type="file"
              accept=".csv,.json,.txt"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="space-y-2">
              <FileUp className="w-10 h-10 text-indigo-400 mx-auto" />
              <p className="text-xs font-medium text-slate-200">
                Kéo thả hoặc nhấp chọn file <b>.CSV</b>, <b>.JSON</b>, <b>.TXT</b> từ máy tính
              </p>
              <p className="text-[11px] text-slate-500">
                {fileName ? `Đã chọn file: ${fileName}` : 'Định dạng UTF-8 tự động mã hóa'}
              </p>
            </div>
          </div>

          {fileError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>{fileError}</span>
            </div>
          )}

          {importSuccessMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{importSuccessMsg}</span>
            </div>
          )}

          {/* File Preview Table */}
          {filePreview.length > 0 && (
            <div className="space-y-3 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Xem trước {filePreview.length} mục sẽ nạp:</span>
                <button
                  onClick={handleConfirmFileImport}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-lg shadow-emerald-600/30 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Xác Nhận Nạp Tất Cả Vào CSDL</span>
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 border-b border-slate-800">
                      <th className="py-2 px-3">Tiếng Nhật</th>
                      <th className="py-2 px-3">Nghĩa Tiếng Việt</th>
                      <th className="py-2 px-3">Loại từ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filePreview.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-bold text-white">{item.japanese}</td>
                        <td className="py-2 px-3">{item.vietnamese}</td>
                        <td className="py-2 px-3 text-slate-400">{item.type || 'Từ vựng'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: AI GENERATOR */}
      {activeSubTab === 'ai' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Sinh Dữ Liệu Tự Động Bằng Gemini AI</h3>
              <p className="text-xs text-slate-400">Nhập bất kỳ chủ đề tiếng Nhật nào để Gemini AI thiết kế bài tập phản xạ</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Chủ đề tiếng Nhật muốn học</label>
              <input
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="VD: Giao tiếp trong nhà hàng / Xin lỗi sếp / Phỏng vấn IT..."
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Số lượng câu</label>
              <select
                value={aiCount}
                onChange={(e) => setAiCount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value={5}>5 câu mẫu</option>
                <option value={10}>10 câu mẫu</option>
                <option value={15}>15 câu mẫu</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleAIGenerate}
            disabled={isGenerating}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-indigo-600/25"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                <span>Gemini đang tự động biên soạn từ vựng & ví dụ...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 text-amber-300" />
                <span>Yêu Cầu Gemini AI Sinh Bài Tập Ngay</span>
              </>
            )}
          </button>

          {aiError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>{aiError}</span>
            </div>
          )}

          {/* AI Generated Preview */}
          {aiGeneratedItems.length > 0 && (
            <div className="space-y-3 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400">
                  ✨ Gemini đã sinh thành công {aiGeneratedItems.length} mục:
                </span>
                <button
                  onClick={handleConfirmAIImport}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-lg shadow-emerald-600/30 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Nạp Vào CSDL Local</span>
                </button>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {aiGeneratedItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{item.japanese}</span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                        {item.type} • {item.jlpt}
                      </span>
                    </div>
                    <div className="text-emerald-400 font-medium">{item.vietnamese}</div>
                    {item.exampleJp && (
                      <div className="text-slate-400 text-[11px]">
                        Ví dụ: <i>{item.exampleJp}</i> ({item.exampleVi})
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
