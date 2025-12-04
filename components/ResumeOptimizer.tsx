import React, { useState } from 'react';
import { analyzeResume, generateCoverLetter } from '../services/geminiService';
import { AtsAnalysisResult } from '../types';
import RadialScore from './RadialScore';
import { FileText, CheckCircle, AlertCircle, Briefcase, FileSignature, Loader2 } from 'lucide-react';

const ResumeOptimizer: React.FC = () => {
  const [resumeText, setResumeText] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [clLoading, setClLoading] = useState(false);
  const [result, setResult] = useState<AtsAnalysisResult | null>(null);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!resumeText || !jobDesc) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await analyzeResume(resumeText, jobDesc);
      setResult(data);
    } catch (e) {
      alert("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCL = async () => {
    if (!resumeText || !jobDesc) return;
    setClLoading(true);
    try {
      const text = await generateCoverLetter(resumeText, jobDesc);
      setCoverLetter(text);
    } catch (e) {
      alert("Cover letter generation failed.");
    } finally {
      setClLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-y-auto pr-2">
      {/* Input Section */}
      <div className="space-y-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-semibold text-white">Job Description</h2>
          </div>
          <textarea
            className="w-full h-40 bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none placeholder-slate-500"
            placeholder="Paste the job description here..."
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
          />
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-semibold text-white">Your Resume</h2>
          </div>
          <textarea
            className="w-full h-60 bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none placeholder-slate-500"
            placeholder="Paste your resume content here..."
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleAnalyze}
            disabled={loading || !resumeText || !jobDesc}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium py-3 rounded-lg transition-all flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            Scan Resume
          </button>
          <button
             onClick={handleGenerateCL}
             disabled={clLoading || !resumeText || !jobDesc}
             className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium py-3 rounded-lg transition-all flex justify-center items-center gap-2"
          >
            {clLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <FileSignature className="w-5 h-5" />}
            Write Cover Letter
          </button>
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-6">
        {result && (
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 animate-fade-in">
            <h3 className="text-lg font-semibold text-white mb-4 border-b border-slate-700 pb-2">Analysis Results</h3>
            
            <RadialScore score={result.matchScore} label="ATS Match" />

            <div className="mt-6 space-y-4">
              <div className="bg-slate-900/50 p-4 rounded-lg">
                <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Analysis Summary</h4>
                <p className="text-sm text-slate-200 leading-relaxed">{result.summary}</p>
              </div>

              {result.missingKeywords.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <h4 className="text-red-400 text-sm font-bold">Missing Keywords</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.missingKeywords.map((kw, i) => (
                      <span key={i} className="px-2 py-1 bg-red-500/20 text-red-200 text-xs rounded-full">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                 <h4 className="text-blue-400 text-sm font-bold mb-2">Suggestions</h4>
                 <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                    {result.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                 </ul>
              </div>
            </div>
          </div>
        )}

        {coverLetter && (
           <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 animate-fade-in">
              <h3 className="text-lg font-semibold text-white mb-4 border-b border-slate-700 pb-2">Generated Cover Letter</h3>
              <div className="bg-white text-slate-900 p-6 rounded-lg shadow-inner whitespace-pre-wrap font-serif text-sm leading-relaxed">
                {coverLetter}
              </div>
              <button 
                onClick={() => navigator.clipboard.writeText(coverLetter)}
                className="mt-4 w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded transition-colors"
              >
                Copy to Clipboard
              </button>
           </div>
        )}

        {!result && !coverLetter && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-xl p-10">
            <Briefcase className="w-12 h-12 mb-4 opacity-50" />
            <p>Enter job details and resume to start analysis.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeOptimizer;