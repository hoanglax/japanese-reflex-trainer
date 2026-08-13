import React, { useState } from 'react';
import { 
  Database, 
  Search, 
  Trash2, 
  Download, 
  Volume2, 
  Filter, 
  Plus, 
  Layers, 
  BookOpen,
  FileSpreadsheet,
  FileCode
} from 'lucide-react';
import { VocabItem } from '../types';

interface VocabManagerProps {
  vocabList: VocabItem[];
  onDeleteItem: (id: string) => void;
  onNavigateToEntry: () => void;
}

export const VocabManager: React.FC<VocabManagerProps> = ({
  vocabList,
  onDeleteItem,
  onNavigateToEntry,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [selectedJlpt, setSelectedJlpt] = useState('Tất cả');

  // Play audio speech
  const playJapaneseAudio = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // Filter items
  const filteredList = vocabList.filter((item) => {
    const matchesSearch =
      item.japanese.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vietnamese.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kana.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCat = selectedCategory === 'Tất cả' || item.type === selectedCategory;
    const matchesJlpt = selectedJlpt === 'Tất cả' || item.jlpt === selectedJlpt;

    return matchesSearch && matchesCat && matchesJlpt;
  });

  // Export data as JSON
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(vocabList, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `japanese_reflex_vocab_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export data as CSV
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // UTF-8 BOM
    csvContent += "japanese,kana,romaji,vietnamese,type,jlpt,exampleJp,exampleVi,notes\n";

    vocabList.forEach((item) => {
      const row = [
        `"${item.japanese.replace(/"/g, '""')}"`,
        `"${(item.kana || '').replace(/"/g, '""')}"`,
        `"${(item.romaji || '').replace(/"/g, '""')}"`,
        `"${item.vietnamese.replace(/"/g, '""')}"`,
        `"${(item.type || '').replace(/"/g, '""')}"`,
        `"${(item.jlpt || '').replace(/"/g, '""')}"`,
        `"${(item.exampleJp || '').replace(/"/g, '""')}"`,
        `"${(item.exampleVi || '').replace(/"/g, '""')}"`,
        `"${(item.notes || '').replace(/"/g, '""')}"`,
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `japanese_reflex_vocab_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Kho Từ Vựng & Cấu Trúc
              <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full">
                {vocabList.length} thẻ thẻ trong CSDL
              </span>
            </h2>
            <p className="text-xs text-slate-400">Quản lý, tìm kiếm và xuất dữ liệu tiếng Nhật cá nhân</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportJSON}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
          >
            <FileCode className="w-3.5 h-3.5 text-sky-400" />
            <span>Xuất JSON</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Xuất CSV</span>
          </button>
          <button
            onClick={onNavigateToEntry}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors shadow-md shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Mới / Nạp File</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo từ Nhật, Hán tự, Kana, nghĩa tiếng Việt..."
            className="w-full bg-slate-900 border border-slate-800 text-white placeholder-slate-500 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
        >
          <option value="Tất cả">Tất cả phân loại</option>
          <option value="Từ vựng">Từ vựng</option>
          <option value="Động từ">Động từ</option>
          <option value="Tính từ">Tính từ</option>
          <option value="Mẫu ngữ pháp">Mẫu ngữ pháp</option>
          <option value="Cụm giao tiếp">Cụm giao tiếp</option>
          <option value="Mẫu câu nhờ vả">Mẫu câu nhờ vả</option>
          <option value="Khiêm nhường ngữ">Khiêm nhường ngữ</option>
          <option value="Từ vựng IT">Từ vựng IT</option>
        </select>

        <select
          value={selectedJlpt}
          onChange={(e) => setSelectedJlpt(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
        >
          <option value="Tất cả">Tất cả trình độ (N5 - N1)</option>
          <option value="N5">N5 (Sơ cấp 1)</option>
          <option value="N4">N4 (Sơ cấp 2)</option>
          <option value="N3">N3 (Trung cấp 1)</option>
          <option value="N2">N2 (Trung cấp 2)</option>
          <option value="N1">N1 (Cao cấp)</option>
        </select>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {filteredList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p>Không tìm thấy mục từ vựng nào phù hợp với bộ lọc.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Tiếng Nhật & Furigana</th>
                  <th className="py-3 px-4">Nghĩa Tiếng Việt</th>
                  <th className="py-3 px-4">Phân Loại</th>
                  <th className="py-3 px-4">JLPT</th>
                  <th className="py-3 px-4">Ví Dụ Mẫu</th>
                  <th className="py-3 px-4">Độ Nhớ (SRS)</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-medium">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-white">{item.japanese}</span>
                        <button
                          onClick={() => playJapaneseAudio(item.japanese)}
                          className="p-1 text-slate-400 hover:text-indigo-400 rounded transition-colors"
                          title="Nghe âm thanh"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {item.kana && <div className="text-[11px] text-slate-400">{item.kana}</div>}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-200">
                      {item.vietnamese}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300">
                        {item.type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {item.jlpt}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-400">
                      {item.exampleJp ? (
                        <div>
                          <div className="text-slate-200 font-medium truncate">{item.exampleJp}</div>
                          <div className="text-[10px] text-slate-500 truncate">{item.exampleVi}</div>
                        </div>
                      ) : (
                        <span className="text-slate-600 italic">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-400 h-full rounded-full"
                            style={{ width: `${Math.min(100, item.masteryScore || 0)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.masteryScore || 0}%
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onDeleteItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Xóa khỏi kho"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
