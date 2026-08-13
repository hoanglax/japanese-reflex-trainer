import React from 'react';
import { X, Keyboard, Zap, Volume2, ArrowRight } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Enter', description: 'Gửi câu trả lời phản xạ / Chuyển sang câu hỏi tiếp theo', icon: ArrowRight },
    { key: 'Ctrl + Space', description: 'Phát âm thanh đọc câu tiếng Nhật (Speech Synthesis)', icon: Volume2 },
    { key: 'Space', description: 'Mở gợi ý ngữ cảnh hoặc tập trung ô nhập', icon: Zap },
    { key: '?', description: 'Mở/đóng bảng hướng dẫn phím tắt này', icon: Keyboard },
    { key: 'Esc', description: 'Đóng cửa sổ modal hoặc tạm dừng đếm ngược', icon: X },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <Keyboard className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Hướng Dẫn Phím Tắt (Hotkeys)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5 text-xs">
          {shortcuts.map((sc, idx) => {
            const Icon = sc.icon;
            return (
              <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex items-center space-x-2 text-slate-300">
                  <Icon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{sc.description}</span>
                </div>
                <kbd className="px-2 py-1 bg-slate-800 text-indigo-300 border border-slate-700 font-mono text-[10px] font-bold rounded-md shadow-sm">
                  {sc.key}
                </kbd>
              </div>
            );
          })}
        </div>

        <div className="pt-2 text-center">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
          >
            Đã Hiểu (Đóng)
          </button>
        </div>
      </div>
    </div>
  );
};
