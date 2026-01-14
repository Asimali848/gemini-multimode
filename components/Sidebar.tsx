
import React from 'react';
import { AppView } from '../types';
import { Icons } from '../constants';

interface SidebarProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  const navItems = [
    { id: AppView.CHAT, label: 'Chat', icon: <Icons.Chat /> },
    { id: AppView.IMAGE_LAB, label: 'Image Lab', icon: <Icons.Image /> },
    { id: AppView.LIVE_VOICE, label: 'Live Voice', icon: <Icons.Live /> },
  ];

  return (
    <aside className="w-20 md:w-64 glass flex flex-col border-r border-slate-800 transition-all duration-300">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <span className="font-bold text-white">G</span>
        </div>
        <h1 className="hidden md:block font-bold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Studio
        </h1>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
              activeView === item.id
                ? 'bg-slate-800 text-indigo-400 shadow-inner border border-slate-700'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <span className={`text-xl transition-transform group-hover:scale-110 ${activeView === item.id ? 'scale-110' : ''}`}>
              {item.icon}
            </span>
            <span className="hidden md:block font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="hidden md:block p-3 rounded-xl bg-slate-900/50 border border-slate-800/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Storage</span>
            <span className="text-xs text-indigo-400">85%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 w-[85%]" />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
