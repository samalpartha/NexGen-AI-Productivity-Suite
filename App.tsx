import React, { useState } from 'react';
import { ActiveTool } from './types';
import ResumeOptimizer from './components/ResumeOptimizer';
import ContentHumanizer from './components/ContentHumanizer';
import SeoOptimizer from './components/SeoOptimizer';
import BackgroundRemover from './components/BackgroundRemover';
import LatexConverter from './components/LatexConverter';
import { FileText, Edit3, BarChart, Bot, Menu, X, Layers, FileCode } from 'lucide-react';

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ActiveTool>(ActiveTool.RESUME_OPTIMIZER);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const navItems = [
    { id: ActiveTool.RESUME_OPTIMIZER, label: 'Resume Scanner', icon: <FileText className="w-5 h-5" /> },
    { id: ActiveTool.CONTENT_HUMANIZER, label: 'Plagiarism Remover', icon: <Edit3 className="w-5 h-5" /> },
    { id: ActiveTool.SEO_ANALYZER, label: 'SEO Optimizer', icon: <BarChart className="w-5 h-5" /> },
    { id: ActiveTool.BACKGROUND_REMOVER, label: 'BG Remover', icon: <Layers className="w-5 h-5" /> },
    { id: ActiveTool.LATEX_CONVERTER, label: 'LaTeX Converter', icon: <FileCode className="w-5 h-5" /> },
  ];

  const renderContent = () => {
    switch (activeTool) {
      case ActiveTool.RESUME_OPTIMIZER: return <ResumeOptimizer />;
      case ActiveTool.CONTENT_HUMANIZER: return <ContentHumanizer />;
      case ActiveTool.SEO_ANALYZER: return <SeoOptimizer />;
      case ActiveTool.BACKGROUND_REMOVER: return <BackgroundRemover />;
      case ActiveTool.LATEX_CONVERTER: return <LatexConverter />;
      default: return <ResumeOptimizer />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 w-full bg-slate-900 border-b border-slate-800 z-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-indigo-500" />
            <span className="font-bold text-white">Nexus Agent</span>
        </div>
        <button onClick={toggleSidebar} className="text-slate-300">
          {sidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:block
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg tracking-tight">Nexus Agent</h1>
            <p className="text-xs text-slate-500">Multi-Agent Workspace</p>
          </div>
        </div>

        <nav className="p-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTool(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                ${activeTool === item.id 
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }
              `}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
            <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-xs text-slate-400 text-center">Powered by Gemini 2.5 & 3.0</p>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden pt-16 lg:pt-0 bg-slate-950">
        <div className="h-full p-4 lg:p-8 max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default App;