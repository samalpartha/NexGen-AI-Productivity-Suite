import React, { useState } from 'react';
import { humanizeContent } from '../services/geminiService';
import { HumanizerResult, HumanizerMode } from '../types';
import { Wand2, Loader2, Copy, ShieldCheck, ArrowRight, Settings2 } from 'lucide-react';

const ContentHumanizer: React.FC = () => {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<HumanizerMode>('Standard');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HumanizerResult | null>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    if (!val.trim()) {
      setResult(null);
    }
  };

  const handleHumanize = async () => {
    if (!text) return;
    setLoading(true);
    try {
      const data = await humanizeContent(text, mode);
      setResult(data);
    } catch (e) {
      alert("Humanization failed.");
    } finally {
      setLoading(false);
    }
  };

  const modes: HumanizerMode[] = ['Standard', 'Academic', 'Formal', 'Casual', 'Shorten', 'Expand'];

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            AI Plagiarism Remover & Humanizer
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Rewrite content to bypass AI detection and remove plagiarism flags.
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
          <Settings2 className="w-4 h-4 text-slate-400 ml-1" />
          <select 
            value={mode} 
            onChange={(e) => setMode(e.target.value as HumanizerMode)}
            className="bg-transparent text-sm text-slate-200 focus:outline-none cursor-pointer hover:text-white"
          >
            {modes.map(m => (
              <option key={m} value={m} className="bg-slate-800">{m} Mode</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
        {/* Input */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-300">Original AI Content</label>
          <textarea
            className="flex-1 w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-sm text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none placeholder-slate-600 leading-relaxed font-mono"
            placeholder="Paste text here to humanize..."
            value={text}
            onChange={handleTextChange}
          />
          <button
            onClick={handleHumanize}
            disabled={loading || !text}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium py-3 rounded-lg transition-all flex justify-center items-center gap-2 shadow-lg shadow-emerald-900/20"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Wand2 className="w-5 h-5" />}
            Humanize Text ({mode})
          </button>
        </div>

        {/* Output */}
        <div className="flex flex-col gap-2 relative">
          <label className="text-sm font-medium text-slate-300">Humanized Output (Formatting Preserved)</label>
          <div className="flex-1 w-full bg-slate-800 border border-slate-700 rounded-lg p-4 relative overflow-hidden group flex flex-col">
            {result ? (
              <div className="h-full flex flex-col">
                 <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-2 shrink-0">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      Plagiarism Risk Reduced by {result.plagiarismRiskScore}%
                    </span>
                    <button 
                      onClick={() => navigator.clipboard.writeText(result.humanizedText)}
                      className="text-slate-400 hover:text-white transition-colors"
                      title="Copy"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                 </div>
                 
                 {/* Main content with whitespace-pre-wrap to preserve formatting */}
                 <div className="flex-1 overflow-y-auto pr-2">
                   <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                     {result.humanizedText}
                   </p>
                   
                   <div className="mt-6 pt-4 border-t border-slate-700/50">
                      <h4 className="text-xs font-bold text-slate-500 mb-2">Changes Applied</h4>
                      <ul className="space-y-1">
                        {result.changesMade.map((change, i) => (
                          <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                            <ArrowRight className="w-3 h-3 mt-0.5 text-emerald-500 shrink-0" />
                            {change}
                          </li>
                        ))}
                      </ul>
                   </div>
                 </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600">
                <ShieldCheck className="w-12 h-12 mb-2 opacity-20" />
                <p className="text-sm">Processed output will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentHumanizer;