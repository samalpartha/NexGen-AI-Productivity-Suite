import React, { useState } from 'react';
import { humanizeContent } from '../services/apiService';
import { HumanizerResult, HumanizerMode } from '../types';
import { Wand2, Loader2, Copy, ShieldCheck, ArrowRight, Settings2 } from 'lucide-react';

const ContentHumanizer: React.FC = () => {
  const [content, setContent] = useState('');
  const [mode, setMode] = useState<HumanizerMode>('Standard');
  const [isLoading, setIsLoading] = useState(false);
  const [humanizedText, setHumanizedText] = useState('');
  const [changes, setChanges] = useState<string[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [userApiKey, setUserApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showHumanized, setShowHumanized] = useState(false);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    if (!val.trim()) {
      setHumanizedText('');
      setChanges([]);
      setScore(null);
      setShowHumanized(false);
      setError(null);
    }
  };

  const handleHumanize = async () => {
    if (!content.trim()) return;

    setIsLoading(true);
    setError(null);
    setShowKeyInput(false);

    try {
      // Use user provided key if available
      const result = await humanizeContent(content, mode, userApiKey);

      setHumanizedText(result.humanizedText);
      setChanges(result.changesMade);
      setScore(result.plagiarismRiskScore);
      setShowHumanized(true);
    } catch (err: any) {
      console.error(err);
      if (err.message === 'MISSING_API_KEY' || err.message?.includes('API key')) {
        setShowKeyInput(true);
        setError('API Key missing. Please enter your Google Gemini API Key below to continue (Free Tier).');
      } else {
        setError(err.message || 'Failed to humanize content. Please try again.');
      }
    } finally {
      setIsLoading(false);
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
            value={content}
            onChange={handleTextChange}
            placeholder="Paste your content here to humanize..."
            className="w-full h-64 p-4 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none font-medium text-gray-600"
          />

          <div className="flex justify-end">
            <button
              onClick={handleHumanize}
              disabled={!content || isLoading}
              className={`
                            px-8 py-3 rounded-lg font-semibold text-white shadow-lg transition-all duration-200 flex items-center gap-2
                            ${!content || isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transform hover:-translate-y-0.5'
                }
                        `}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Humanizing...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Humanize Content
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
              <span>⚠️ {error}</span>
            </div>
          )}

          {showHumanized && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                  <div className="flex items-center gap-2 text-green-800 font-semibold mb-1">
                    <ShieldCheck className="w-5 h-5" />
                    AI Score
                  </div>
                  <div className="text-2xl font-bold text-green-600">{100 - (score || 0)}% Human</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 col-span-2">
                  <div className="flex items-center gap-2 text-blue-800 font-semibold mb-1">
                    <Settings2 className="w-5 h-5" />
                    Optimization
                  </div>
                  <div className="text-blue-600 text-sm">
                    {changes.length} enhancements made to sentence structure & vocabulary
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 rounded-xl overflow-hidden shadow-xl">
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                  <span className="text-gray-400 font-medium">Humanized Output</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(humanizedText)}
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Text
                  </button>
                </div>
                <div className="p-6">
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {humanizedText}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentHumanizer;