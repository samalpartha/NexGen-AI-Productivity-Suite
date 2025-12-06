import React, { useState } from 'react';
import { analyzeSeo } from '../services/apiService';
import { SeoAnalysisResult } from '../types';
import RadialScore from './RadialScore';
import { Search, Globe, FileText, Check, X, Loader2, Gauge, BarChart3 } from 'lucide-react';

const SeoOptimizer: React.FC = () => {
  const [input, setInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [mode, setMode] = useState<'url' | 'content'>('url');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SeoAnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!input || !keyword) return;
    setLoading(true);
    try {
      const data = await analyzeSeo(input, keyword, mode === 'url');
      setResult(data);
    } catch (e) {
      alert("SEO Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto pr-2">
      {/* Sidebar Controls */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">SEO Auditor</h2>
          </div>

          <div className="flex bg-slate-900 rounded-lg p-1 mb-6">
            <button
              onClick={() => setMode('url')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'url' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              URL Analysis
            </button>
            <button
              onClick={() => setMode('content')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'content' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Content Check
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Target Keyword</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="e.g. digital marketing"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">
                {mode === 'url' ? 'Page URL' : 'Content Body'}
              </label>
              {mode === 'url' ? (
                <div className="relative">
                  <Globe className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="https://example.com/post"
                  />
                </div>
              ) : (
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full h-40 bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                  placeholder="Paste your blog content here..."
                />
              )}
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || !input || !keyword}
              className="w-full mt-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium py-3 rounded-lg transition-all flex justify-center items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Gauge className="w-5 h-5" />}
              Start Audit
            </button>
          </div>
        </div>
      </div>

      {/* Main Analysis Area */}
      <div className="lg:col-span-8">
        {result ? (
          <div className="space-y-6 animate-fade-in">
            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <RadialScore score={result.seoScore} label="SEO Score" color="#a855f7" />
              </div>
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col justify-center space-y-4">
                <div>
                  <span className="text-slate-400 text-xs font-bold uppercase">Readability</span>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-white">{result.readabilityScore}/100</span>
                  </div>
                  <div className="w-full bg-slate-700 h-2 rounded-full mt-2">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${result.readabilityScore}%` }}></div>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-xs font-bold uppercase">Estimated Load Perf.</span>
                  <p className="text-white font-medium">{result.loadingSpeedQualitative}</p>
                </div>
              </div>
            </div>

            {/* Keyword & Meta */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Content Insights</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-slate-900 p-4 rounded-lg">
                  <span className="text-purple-400 text-xs font-bold uppercase block mb-1">Keyword Density Analysis</span>
                  <p className="text-slate-300 text-sm">{result.keywordDensity}</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-lg">
                  <span className="text-blue-400 text-xs font-bold uppercase block mb-1">Meta Description Check</span>
                  <p className="text-slate-300 text-sm">{result.metaDescription}</p>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">RankMath-Style Checklist</h3>
              <ul className="space-y-3">
                {result.improvementChecklist.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
                    {item.toLowerCase().includes('good') || item.toLowerCase().includes('great') ? (
                      <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    )}
                    <span className="text-slate-300 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="h-full bg-slate-800 rounded-xl border border-slate-700 flex flex-col items-center justify-center text-slate-500">
            <BarChart3 className="w-16 h-16 opacity-20 mb-4" />
            <p>Enter URL or Content to generate a detailed SEO report.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeoOptimizer;