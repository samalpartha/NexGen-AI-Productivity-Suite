import React, { useState, useRef } from 'react';
import { convertDocument } from '../services/apiService';
import { FileText, ArrowRightLeft, Download, Upload, Loader2, Copy, FileCode, FileType } from 'lucide-react';
import mammoth from 'mammoth';
import { Document, Packer, Paragraph, TextRun } from "docx";

type ConversionMode = 'latex-to-word' | 'word-to-latex';

const LatexConverter: React.FC = () => {
  const [mode, setMode] = useState<ConversionMode>('latex-to-word');
  const [inputText, setInputText] = useState('');
  const [fileInput, setFileInput] = useState<{ name: string; data: string; mimeType: string } | null>(null);
  const [outputText, setOutputText] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset previous inputs
    setInputText('');
    setFileInput(null);

    if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        setFileInput({
          name: file.name,
          data: base64Data,
          mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
    else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // Extract text from docx immediately
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setInputText(result.value);
        setFileInput({ name: file.name, data: '', mimeType: file.type }); // Just for display
      } catch (err) {
        alert("Failed to read DOCX file.");
      }
    }
    else {
      // Treat as text (tex files, txt, etc.)
      const text = await file.text();
      setInputText(text);
      setFileInput({ name: file.name, data: '', mimeType: 'text/plain' });
    }
  };

  const handleConvert = async () => {
    if (!inputText && !fileInput) return;
    setLoading(true);

    // Determine target format
    const target = mode === 'latex-to-word' ? 'docx' : 'latex';

    // Prepare input
    // If we have binary data (PDF) use that, otherwise use inputText
    const input = (fileInput && fileInput.mimeType === 'application/pdf')
      ? { mimeType: fileInput.mimeType, data: fileInput.data }
      : inputText;

    try {
      const result = await convertDocument(input, target);
      setOutputText(result);
    } catch (e) {
      alert("Conversion failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadResult = () => {
    if (!outputText) return;

    if (mode === 'word-to-latex') {
      // Download as .tex
      const blob = new Blob([outputText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'converted.tex';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Download as DOCX
      const doc = new Document({
        sections: [{
          properties: {},
          children: outputText.split('\n').map(line =>
            new Paragraph({
              children: [new TextRun(line)],
            })
          ),
        }],
      });

      Packer.toBlob(doc).then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'converted.docx';
        a.click();
        URL.revokeObjectURL(url);
      });
    }
  };

  const toggleMode = () => {
    setMode(prev => prev === 'latex-to-word' ? 'word-to-latex' : 'latex-to-word');
    setInputText('');
    setOutputText('');
    setFileInput(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const clearFile = () => {
    setFileInput(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <ArrowRightLeft className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-semibold text-white">LaTeX &lt;&gt; Word Converter</h2>
          </div>
          <p className="text-slate-400 text-sm">
            Convert complex LaTeX documents to Word (DOCX) format, or turn your documents into professional LaTeX code.
          </p>
        </div>

        <button
          onClick={toggleMode}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm text-white transition-colors border border-slate-600"
        >
          <span className={mode === 'latex-to-word' ? 'text-orange-400 font-bold' : 'text-slate-400'}>LaTeX</span>
          <ArrowRightLeft className="w-4 h-4 text-slate-400" />
          <span className={mode === 'word-to-latex' ? 'text-orange-400 font-bold' : 'text-slate-400'}>Word (DOCX)</span>
        </button>
      </div>

      {/* Editor Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">

        {/* Input Panel */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-slate-300 uppercase tracking-wide">
              Input ({mode === 'latex-to-word' ? 'LaTeX Code / File' : 'Document Content / File'})
            </label>
            <div className="flex items-center gap-2">
              {fileInput && (
                <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300 border border-slate-700 flex items-center gap-1">
                  {fileInput.name} <button onClick={clearFile}><Upload className="w-3 h-3 rotate-45" /></button>
                </span>
              )}
              <button onClick={() => fileRef.current?.click()} className="text-xs flex items-center gap-1 text-orange-400 hover:text-orange-300">
                <Upload className="w-3 h-3" /> Upload
              </button>
              <input type="file" ref={fileRef} className="hidden" accept=".tex,.txt,.docx,.pdf" onChange={handleFileChange} />
            </div>
          </div>

          <textarea
            className="flex-1 w-full bg-slate-900 border border-slate-700 rounded-lg p-4 font-mono text-sm text-slate-200 focus:ring-2 focus:ring-orange-500 outline-none resize-none placeholder-slate-600 leading-relaxed"
            placeholder={mode === 'latex-to-word' ? "\\documentclass{article}\n\\begin{document}\n..." : "Paste your document text here..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={!!fileInput && fileInput.mimeType === 'application/pdf'} // Disable text edit if PDF uploaded
          />

          <button
            onClick={handleConvert}
            disabled={loading || (!inputText && !fileInput)}
            className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium py-3 rounded-lg transition-all flex justify-center items-center gap-2 shadow-lg shadow-orange-900/20"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <ArrowRightLeft className="w-5 h-5" />}
            {mode === 'latex-to-word' ? 'Convert to Word' : 'Convert to LaTeX'}
          </button>
        </div>

        {/* Output Panel */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-slate-300 uppercase tracking-wide">
              Output ({mode === 'latex-to-word' ? 'Word (DOCX) Preview' : 'LaTeX Source'})
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(outputText)}
                className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                title="Copy"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={downloadResult}
                className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 w-full bg-slate-800 border border-slate-700 rounded-lg p-4 overflow-y-auto relative">
            {outputText ? (
              <pre className="whitespace-pre-wrap font-mono text-sm text-slate-300">
                {outputText}
              </pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600">
                {mode === 'latex-to-word' ? <FileText className="w-12 h-12 mb-2 opacity-20" /> : <FileCode className="w-12 h-12 mb-2 opacity-20" />}
                <p className="text-sm">Converted result will appear here.</p>
              </div>
            )}
          </div>

          {outputText && (
            <button
              onClick={downloadResult}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-lg transition-all flex justify-center items-center gap-2 border border-slate-600"
            >
              <Download className="w-5 h-5" />
              Download as {mode === 'latex-to-word' ? 'DOCX' : '.TEX'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default LatexConverter;