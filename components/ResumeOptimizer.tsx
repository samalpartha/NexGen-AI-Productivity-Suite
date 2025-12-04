import React, { useState, useRef } from 'react';
import { analyzeResume, generateCoverLetter, ResumeInput } from '../services/geminiService';
import { AtsAnalysisResult } from '../types';
import RadialScore from './RadialScore';
import { FileText, CheckCircle, AlertCircle, Briefcase, FileSignature, Loader2, Upload, X, File as FileIcon } from 'lucide-react';
import mammoth from 'mammoth';

const ResumeOptimizer: React.FC = () => {
  const [resumeText, setResumeText] = useState('');
  const [resumeFile, setResumeFile] = useState<{ name: string; data: string; mimeType: string } | null>(null);
  const [jobDesc, setJobDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [clLoading, setClLoading] = useState(false);
  const [result, setResult] = useState<AtsAnalysisResult | null>(null);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getResumeInput = (): ResumeInput | null => {
    // If it's a PDF, we send the file data directly to the model
    if (resumeFile && resumeFile.mimeType === 'application/pdf') {
      return { mimeType: resumeFile.mimeType, data: resumeFile.data };
    }
    // If it's a DOCX (which we converted to text) or manual text entry, we send the text string
    if (resumeText) {
      return resumeText;
    }
    return null;
  };

  const handleAnalyze = async () => {
    const input = getResumeInput();
    if (!input || !jobDesc) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await analyzeResume(input, jobDesc);
      setResult(data);
    } catch (e) {
      alert("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCL = async () => {
    const input = getResumeInput();
    if (!input || !jobDesc) return;
    setClLoading(true);
    try {
      const text = await generateCoverLetter(input, jobDesc);
      setCoverLetter(text);
    } catch (e) {
      alert("Cover letter generation failed.");
    } finally {
      setClLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // remove data:application/pdf;base64, prefix
        const base64Data = base64String.split(',')[1];
        setResumeFile({
          name: file.name,
          data: base64Data,
          mimeType: file.type
        });
        setResumeText(''); // Clear text input as we have a binary file
      };
      reader.readAsDataURL(file);
    } 
    else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // For DOCX, we extract text using mammoth
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setResumeText(result.value);
        // We set resumeFile just for the UI display, but empty data since we use the extracted text
        setResumeFile({
          name: file.name,
          data: '',
          mimeType: file.type
        });
      } catch (err) {
        console.error(err);
        alert("Failed to parse DOCX file. Please try converting to PDF or copy-pasting text.");
      }
    }
    else {
      alert("Please upload a PDF or DOCX file.");
    }
  };

  const clearFile = () => {
    setResumeFile(null);
    setResumeText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const hasInput = !!resumeText || !!resumeFile;

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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-semibold text-white">Your Resume</h2>
            </div>
            {!resumeFile && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 border border-indigo-600/20"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload File
              </button>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".pdf,.docx" 
              onChange={handleFileChange} 
            />
          </div>

          {resumeFile ? (
            <div className="w-full h-60 bg-slate-900 border border-slate-700 border-dashed rounded-lg flex flex-col items-center justify-center relative p-4 group">
              <div className="bg-indigo-500/10 p-4 rounded-full mb-3">
                <FileIcon className="w-8 h-8 text-indigo-400" />
              </div>
              <p className="text-slate-200 font-medium text-sm text-center break-all max-w-full px-4">{resumeFile.name}</p>
              <p className="text-slate-500 text-xs mt-1">
                {resumeFile.mimeType.includes('pdf') ? 'PDF Ready for scanning' : 'DOCX Converted to text'}
              </p>
              
              <button 
                onClick={clearFile}
                className="mt-4 text-slate-400 hover:text-red-400 flex items-center gap-1 text-xs transition-colors px-3 py-2 rounded-md hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
                Remove File
              </button>
            </div>
          ) : (
            <textarea
              className="w-full h-60 bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none placeholder-slate-500"
              placeholder="Paste your resume content here, or upload a PDF/DOCX above..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
          )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleAnalyze}
            disabled={loading || !hasInput || !jobDesc}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium py-3 rounded-lg transition-all flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            Scan Resume
          </button>
          <button
             onClick={handleGenerateCL}
             disabled={clLoading || !hasInput || !jobDesc}
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