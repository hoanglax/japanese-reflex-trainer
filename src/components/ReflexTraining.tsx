import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  Volume2, 
  Send, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Sparkles, 
  HelpCircle,
  Award,
  ArrowRight,
  Brain,
  VolumeX
} from 'lucide-react';
import { VocabItem, ReflexDirection, ReflexEvaluation } from '../types';

interface ReflexTrainingProps {
  vocabList: VocabItem[];
  onUpdateSRS: (vocabId: string, score: number) => void;
  onRecordLog: (log: any) => void;
}

export const ReflexTraining: React.FC<ReflexTrainingProps> = ({
  vocabList,
  onUpdateSRS,
  onRecordLog,
}) => {
  const [direction, setDirection] = useState<ReflexDirection>('jp-to-vi');
  const [timeLimitSec, setTimeLimitSec] = useState<number>(10);
  const [remainingSec, setRemainingSec] = useState<number>(10);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const [currentItem, setCurrentItem] = useState<VocabItem | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<ReflexEvaluation | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedTimeMs, setElapsedTimeMs] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Load next random item
  const loadNextQuestion = () => {
    if (!vocabList || vocabList.length === 0) {
      setCurrentItem(null);
      return;
    }
    const randomIndex = Math.floor(Math.random() * vocabList.length);
    const item = vocabList[randomIndex];
    setCurrentItem(item);
    setUserAnswer('');
    setEvaluation(null);
    setShowHint(false);
    setRemainingSec(timeLimitSec);
    setIsTimerRunning(true);
    setStartTime(Date.now());

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  useEffect(() => {
    loadNextQuestion();
  }, [vocabList.length]);

  // Timer countdown
  useEffect(() => {
    let timer: any = null;
    if (isTimerRunning && remainingSec > 0 && !evaluation) {
      timer = setInterval(() => {
        setRemainingSec((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            handleAutoSubmitOnTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, remainingSec, evaluation]);

  const handleAutoSubmitOnTimeout = () => {
    handleSubmitAnswer(true);
  };

  // Text to speech Japanese
  const playJapaneseAudio = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // Evaluate reflex answer via Express Gemini API
  const handleSubmitAnswer = async (isTimeout = false) => {
    if (!currentItem) return;
    setIsTimerRunning(false);
    const endTime = Date.now();
    const timeSpentMs = isTimeout ? timeLimitSec * 1000 : Math.max(100, endTime - startTime);
    setElapsedTimeMs(timeSpentMs);

    setIsEvaluating(true);

    const promptQ = direction === 'jp-to-vi' ? currentItem.japanese : currentItem.vietnamese;
    const targetExpected = direction === 'jp-to-vi' ? currentItem.vietnamese : currentItem.japanese;

    try {
      const res = await fetch('/api/reflex/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptQuestion: promptQ,
          targetExpected: targetExpected,
          userAnswer: isTimeout ? '(Hết giờ đếm ngược)' : userAnswer,
          direction: direction,
          contextNotes: currentItem.notes,
        }),
      });

      const data = await res.json();
      if (data.success && data.evaluation) {
        setEvaluation(data.evaluation);
        onUpdateSRS(currentItem.id, data.evaluation.score);
        onRecordLog({
          vocabId: currentItem.id,
          promptQuestion: promptQ,
          userAnswer: userAnswer || '(Hết giờ)',
          correctAnswer: data.evaluation.suggestedCorrection || targetExpected,
          score: data.evaluation.score,
          responseTimeMs: timeSpentMs,
          aiFeedback: data.evaluation.explanation,
          practicedAt: new Date().toISOString(),
        });
      } else {
        throw new Error(data.error || 'Lỗi server');
      }
    } catch (err: any) {
      console.error('Error in reflex evaluation:', err);
      // Fallback offline evaluation
      const isMatch = userAnswer.trim().toLowerCase() === targetExpected.trim().toLowerCase();
      const offlineEval: ReflexEvaluation = {
        score: isMatch ? 100 : isTimeout ? 0 : 50,
        isCorrect: isMatch,
        feedback: isTimeout ? 'Hết thời gian phản xạ!' : isMatch ? 'Phản xạ chính xác!' : 'Chưa hoàn toàn chính xác.',
        suggestedCorrection: targetExpected,
        explanation: 'Thử lại bằng cách bật Gemini API key để nhận giải thích chi tiết.',
        naturalExample: currentItem.exampleJp ? `${currentItem.exampleJp} (${currentItem.exampleVi})` : '',
        nuanceNote: currentItem.notes || '',
      };
      setEvaluation(offlineEval);
      onUpdateSRS(currentItem.id, offlineEval.score);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Keyboard shortcut listener
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (evaluation) {
        loadNextQuestion();
      } else {
        handleSubmitAnswer();
      }
    } else if (e.key === ' ' && e.ctrlKey && currentItem) {
      e.preventDefault();
      playJapaneseAudio(currentItem.japanese);
    }
  };

  if (!vocabList || vocabList.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl max-w-xl mx-auto mt-12 text-slate-300">
        <Brain className="w-12 h-12 text-indigo-400 mx-auto mb-4 animate-bounce" />
        <h3 className="text-xl font-bold text-white mb-2">Kho Từ Vựng Đang Trống</h3>
        <p className="text-sm text-slate-400 mb-6">
          Vui lòng chuyển qua tab <b>Nạp Dữ Liệu</b> để thêm từ vựng thủ công, nạp file CSV/JSON hoặc dùng Gemini AI sinh dữ liệu tự động.
        </p>
      </div>
    );
  }

  const isJpToVi = direction === 'jp-to-vi';
  const displayPrompt = currentItem
    ? isJpToVi
      ? currentItem.japanese
      : currentItem.vietnamese
    : '';

  const timerPercent = (remainingSec / timeLimitSec) * 100;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header Config Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Chế Độ Phản Xạ Nhanh (Flash Reflex)</h2>
            <p className="text-xs text-slate-400">Đếm ngược áp lực thời gian & AI phân tích phản xạ</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          {/* Direction selector */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1">
            <button
              onClick={() => { setDirection('jp-to-vi'); loadNextQuestion(); }}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                direction === 'jp-to-vi' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Nhật ➔ Việt
            </button>
            <button
              onClick={() => { setDirection('vi-to-jp'); loadNextQuestion(); }}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                direction === 'vi-to-jp' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Việt ➔ Nhật
            </button>
          </div>

          {/* Time limit selector */}
          <select
            value={timeLimitSec}
            onChange={(e) => {
              const val = Number(e.target.value);
              setTimeLimitSec(val);
              setRemainingSec(val);
              loadNextQuestion();
            }}
            className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value={5}>⏱️ 5 giây (Siêu nhanh)</option>
            <option value={10}>⏱️ 10 giây (Chuẩn)</option>
            <option value={15}>⏱️ 15 giây (Thoải mái)</option>
          </select>

          {/* Audio toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border transition-colors ${
              soundEnabled ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
            title="Bật/Tắt phát âm tự động"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Next Button */}
          <button
            onClick={loadNextQuestion}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đổi câu</span>
          </button>
        </div>
      </div>

      {/* Main Flash Card */}
      {currentItem && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {/* Timer Progress Bar */}
          <div className="w-full bg-slate-950 h-2 relative">
            <div
              className={`h-full transition-all duration-1000 ease-linear ${
                remainingSec <= 3 ? 'bg-rose-500' : remainingSec <= 6 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${timerPercent}%` }}
            />
          </div>

          <div className="p-8 text-center relative">
            {/* Countdown Badge */}
            <div className="absolute top-4 right-4 flex items-center space-x-1 px-3 py-1 bg-slate-950 border border-slate-800 rounded-full text-xs font-mono">
              <Clock className={`w-3.5 h-3.5 ${remainingSec <= 3 ? 'text-rose-400 animate-ping' : 'text-indigo-400'}`} />
              <span className={remainingSec <= 3 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                {remainingSec}s
              </span>
            </div>

            {/* JLPT & Type Badges */}
            <div className="flex items-center justify-center space-x-2 mb-3">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {currentItem.jlpt}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300">
                {currentItem.type}
              </span>
            </div>

            {/* Prompt Question Display */}
            <div className="my-6">
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-wide leading-tight mb-3">
                {displayPrompt}
              </h1>

              {/* Japanese Furigana / Speech */}
              {isJpToVi && currentItem.kana && (
                <div className="flex items-center justify-center space-x-2 text-slate-400 text-sm">
                  <span>{currentItem.kana}</span>
                  {currentItem.romaji && <span className="text-xs text-slate-500">({currentItem.romaji})</span>}
                  <button
                    onClick={() => playJapaneseAudio(currentItem.japanese)}
                    className="p-1 hover:bg-slate-800 text-indigo-400 rounded-full transition-colors"
                    title="Nghe phát âm tiếng Nhật"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Hint toggle */}
            {!evaluation && (
              <div className="mb-4">
                {showHint ? (
                  <p className="text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/20 py-1.5 px-3 rounded-lg inline-block">
                    💡 Gợi ý: {currentItem.notes || 'Không có ghi chú thêm.'}
                  </p>
                ) : (
                  <button
                    onClick={() => setShowHint(true)}
                    className="text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center space-x-1 mx-auto"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Xem gợi ý ngữ cảnh</span>
                  </button>
                )}
              </div>
            )}

            {/* Input Form */}
            <div className="max-w-xl mx-auto space-y-3">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={Boolean(evaluation) || isEvaluating}
                  placeholder={
                    isJpToVi
                      ? 'Gõ nghĩa tiếng Việt tương ứng và ấn Enter...'
                      : 'Gõ tiếng Nhật (Kanji/Kana/Romaji) và ấn Enter...'
                  }
                  className="w-full bg-slate-950 border-2 border-slate-700 focus:border-indigo-500 text-white placeholder-slate-500 rounded-xl px-4 py-3.5 pr-28 text-base shadow-inner focus:outline-none transition-all"
                />
                {!evaluation && (
                  <button
                    onClick={() => handleSubmitAnswer()}
                    disabled={isEvaluating}
                    className="absolute right-2 top-2 bottom-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-md"
                  >
                    {isEvaluating ? (
                      <span className="animate-spin">⏳</span>
                    ) : (
                      <>
                        <span>Gửi (Enter)</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>Nhấn <b>Enter</b> để gửi / chuyển câu tiếp theo</span>
                <span>Nhấn <b>Ctrl + Space</b> để nghe lại âm thanh</span>
              </div>
            </div>
          </div>

          {/* AI Evaluation Result Card */}
          {evaluation && (
            <div className="border-t border-slate-800 bg-slate-950/80 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-xl flex items-center justify-center ${
                      evaluation.isCorrect
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {evaluation.isCorrect ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      {evaluation.isCorrect ? 'ĐẠT PHẢN XẠ THÀNH CÔNG' : 'CẦN LUYỆN THÊM'}
                      <span className="text-xs text-slate-400 font-normal">
                        ({Math.round(elapsedTimeMs / 100) / 10}s)
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">{evaluation.feedback}</p>
                  </div>
                </div>

                {/* Accuracy Score Pill */}
                <div className="text-right">
                  <div className="text-2xl font-black text-indigo-400">{evaluation.score} / 100</div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Điểm Phản Xạ AI</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Correction */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider block mb-1">
                    ✨ CÂU TRẢ LỜI CHUẨN XÁC
                  </span>
                  <div className="text-sm font-semibold text-emerald-300 flex items-center justify-between">
                    <span>{evaluation.suggestedCorrection}</span>
                    <button
                      onClick={() => playJapaneseAudio(evaluation.suggestedCorrection)}
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Example */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
                  <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider block mb-1">
                    💬 VÍ DỤ THỰC TẾ
                  </span>
                  <p className="text-slate-200 italic">{evaluation.naturalExample || 'Chưa có ví dụ.'}</p>
                </div>
              </div>

              {/* Grammar Analysis */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-xs">
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block mb-1">
                  🔍 PHÂN TÍCH NGỮ PHÁP & SẮC THÁI
                </span>
                <p className="text-slate-300 leading-relaxed mb-1">{evaluation.explanation}</p>
                {evaluation.nuanceNote && (
                  <p className="text-amber-300/80 text-[11px] mt-1 pt-1 border-t border-slate-800/80">
                    <b>Lưu ý sắc thái:</b> {evaluation.nuanceNote}
                  </p>
                )}
              </div>

              {/* SRS Rating Bar & Next Question Button */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-400">Đánh giá độ nhớ thẻ (SRS):</span>
                  <button
                    onClick={() => { onUpdateSRS(currentItem.id, 20); loadNextQuestion(); }}
                    className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg font-medium transition-colors"
                  >
                    Quên (Again)
                  </button>
                  <button
                    onClick={() => { onUpdateSRS(currentItem.id, 50); loadNextQuestion(); }}
                    className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg font-medium transition-colors"
                  >
                    Khó (Hard)
                  </button>
                  <button
                    onClick={() => { onUpdateSRS(currentItem.id, 80); loadNextQuestion(); }}
                    className="px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-lg font-medium transition-colors"
                  >
                    Tốt (Good)
                  </button>
                  <button
                    onClick={() => { onUpdateSRS(currentItem.id, 100); loadNextQuestion(); }}
                    className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg font-medium transition-colors"
                  >
                    Dễ (Easy)
                  </button>
                </div>

                <button
                  onClick={loadNextQuestion}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <span>Chuyển Câu Tiếp Theo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
