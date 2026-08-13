import React from 'react';
import { 
  Zap, 
  Database, 
  PlusCircle, 
  BarChart3, 
  Code2, 
  Settings, 
  Sparkles,
  Keyboard,
  Info
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  vocabCount: number;
  apiConfigured: boolean;
  onOpenShortcuts: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  vocabCount,
  apiConfigured,
  onOpenShortcuts,
}) => {
  const menuItems = [
    { id: 'reflex', label: 'Luyện Phản Xạ Nhanh', icon: Zap, badge: 'Flash' },
    { id: 'repository', label: 'Kho Từ Vựng & Câu', icon: Database, count: vocabCount },
    { id: 'data-entry', label: 'Nạp Dữ Liệu (3 Cách)', icon: PlusCircle, highlight: true },
    { id: 'analytics', label: 'Thống Kê Tiến Độ', icon: BarChart3 },
    { id: 'dev-studio', label: 'Mã Nguồn Python Desktop', icon: Code2, badge: 'PySide6' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col justify-between select-none">
      <div>
        {/* Window Header / App Logo */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-sky-500 to-emerald-400 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <span className="text-sm font-bold text-sky-400">日</span>
              </div>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wide text-slate-100 flex items-center gap-1.5">
                JP Reflex AI
                <span className="px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold rounded border border-indigo-500/30">
                  Desktop
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">Reflex Japanese Engine</p>
            </div>
          </div>
        </div>

        {/* API Status Banner */}
        <div className="mx-3 mt-3 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${apiConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-slate-300 font-medium">
              {apiConfigured ? 'Gemini 3.6 Flash Active' : 'Offline / Standard API'}
            </span>
          </div>
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    isActive ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.count}
                  </span>
                )}
                {item.badge && (
                  <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${
                    isActive ? 'bg-white/20 text-white' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Shortcuts Trigger */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        <button
          onClick={onOpenShortcuts}
          className="w-full flex items-center justify-between px-3 py-2 bg-slate-800/60 hover:bg-slate-800 rounded-lg text-xs text-slate-300 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Keyboard className="w-3.5 h-3.5 text-slate-400" />
            <span>Phím tắt (Hotkeys)</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-900 border border-slate-700 rounded text-slate-400">
            ?
          </kbd>
        </button>

        <div className="px-2 text-[11px] text-slate-400 flex items-center justify-between">
          <span>PySide6 + GenAI SDK</span>
          <span>v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};
