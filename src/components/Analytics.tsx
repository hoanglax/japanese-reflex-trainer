import React from 'react';
import { 
  BarChart3, 
  Clock, 
  Brain, 
  Award, 
  TrendingUp, 
  Flame, 
  Zap, 
  Target,
  CheckCircle2
} from 'lucide-react';
import { PracticeLog, VocabItem } from '../types';

interface AnalyticsProps {
  practiceLogs: PracticeLog[];
  vocabList: VocabItem[];
}

export const Analytics: React.FC<AnalyticsProps> = ({ practiceLogs, vocabList }) => {
  const totalPractices = practiceLogs.length;
  const avgScore = totalPractices > 0 
    ? Math.round(practiceLogs.reduce((acc, curr) => acc + curr.score, 0) / totalPractices) 
    : 0;

  const avgSpeedSec = totalPractices > 0
    ? Math.round((practiceLogs.reduce((acc, curr) => acc + curr.responseTimeMs, 0) / totalPractices) / 100) / 10
    : 0;

  const masteredCount = vocabList.filter(v => (v.masteryScore || 0) >= 80).length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Báo Cáo Tiến Độ Phản Xạ & SRS</h2>
            <p className="text-xs text-slate-400">Phân tích tốc độ đáp, độ chính xác và đường cong trí nhớ SuperMemo</p>
          </div>
        </div>
      </div>

      {/* Stats KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-white">{totalPractices}</div>
            <div className="text-[11px] text-slate-400">Lượt Luyện Phản Xạ</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-white">{avgScore} / 100</div>
            <div className="text-[11px] text-slate-400">Điểm Phản Xạ Trung Bình</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3">
          <div className="p-3 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-white">{avgSpeedSec}s</div>
            <div className="text-[11px] text-slate-400">Tốc Độ Đáp Trung Bình</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-white">{masteredCount} / {vocabList.length}</div>
            <div className="text-[11px] text-slate-400">Từ Vựng Thuộc Sâu (&gt;80%)</div>
          </div>
        </div>
      </div>

      {/* SRS Memory Matrix Explanation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Brain className="w-4 h-4 text-indigo-400" />
          <span>Thuật Toán Lặp Lại Ngắt Quãng (SuperMemo SM-2 Matrix)</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Ứng dụng tự động điều chỉnh khoảng thời gian ôn tập (Spaced Repetition Interval) dựa trên điểm phản xạ của bạn.
          Những từ bạn trả lời nhanh và chính xác sẽ được kéo dài thời gian lặp lại, trong khi những từ chưa vững sẽ liên tục được lặp lại để kích thích não bộ ghi nhớ dài hạn.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">LEVEL 0 - MỚI HỌC</span>
            <div className="font-semibold text-white">Ôn lại hàng ngày (1 ngày)</div>
            <p className="text-[11px] text-slate-400">Dành cho từ vựng mới thêm hoặc vừa trả lời sai.</p>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">LEVEL 1 - BẮT ĐẦU NHỚ</span>
            <div className="font-semibold text-white">Ôn lại sau 3 ngày</div>
            <p className="text-[11px] text-slate-400">Đã phản xạ chính xác 1-2 lần liên tiếp.</p>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">LEVEL 2 - THÀNH THỤC</span>
            <div className="font-semibold text-white">Ôn lại sau 7 ngày</div>
            <p className="text-[11px] text-slate-400">Ghi nhớ tốt, phản xạ nhanh dưới 5s.</p>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">LEVEL 3+ - KHẮC SÂU</span>
            <div className="font-semibold text-white">Ôn lại sau 15 - 30 ngày</div>
            <p className="text-[11px] text-slate-400">Phản xạ tự nhiên không cần suy nghĩ.</p>
          </div>
        </div>
      </div>

      {/* Recent Practice History */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white">Lịch Sử Luyện Phản Xạ Gần Đây</h3>

        {practiceLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            Chưa có lượt thực hành nào. Hãy bắt đầu luyện tập ở tab <b>Luyện Phản Xạ Nhanh</b>!
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {practiceLogs.slice().reverse().map((log, idx) => (
              <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-sm">{log.promptQuestion}</div>
                  <div className="text-slate-400 text-[11px]">
                    Câu trả lời: <span className="text-slate-200">{log.userAnswer}</span> | Đáp án chuẩn: <span className="text-emerald-400 font-medium">{log.correctAnswer}</span>
                  </div>
                </div>
                <div className="text-right space-y-0.5">
                  <div className="font-extrabold text-indigo-400 text-sm">{log.score} / 100</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {Math.round(log.responseTimeMs / 100) / 10}s
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
