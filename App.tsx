
import React, { useState, useCallback } from 'react';
import { AppView } from './types';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import ImageLabView from './components/ImageLabView';
import LiveVoiceView from './components/LiveVoiceView';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>(AppView.CHAT);

  const renderView = () => {
    switch (activeView) {
      case AppView.CHAT:
        return <ChatView />;
      case AppView.IMAGE_LAB:
        return <ImageLabView />;
      case AppView.LIVE_VOICE:
        return <LiveVoiceView />;
      default:
        return <ChatView />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 overflow-hidden text-slate-100">
      {/* Navigation Sidebar */}
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full -z-10 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full -z-10 animate-pulse" />
        
        <div className="flex-1 flex flex-col overflow-hidden px-4 md:px-8 py-6">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
