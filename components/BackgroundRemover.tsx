import React, { useState, useRef } from 'react';
import { removeImageBackground } from '../services/geminiService';
import { Image as ImageIcon, Upload, Loader2, Download, Layers, X, ArrowRight } from 'lucide-react';

const BackgroundRemover: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<{ data: string; mimeType: string; name: string } | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      setSelectedFile({
        data: base64Data,
        mimeType: file.type,
        name: file.name
      });
      setProcessedImage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveBackground = async () => {
    if (!selectedFile) return;
    setLoading(true);
    try {
      const resultBase64 = await removeImageBackground(selectedFile.data, selectedFile.mimeType);
      setProcessedImage(resultBase64);
    } catch (error) {
      alert("Failed to process image. The model might be busy or the image format unsupported.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!processedImage) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${processedImage}`;
    link.download = `bg-removed-${selectedFile?.name || 'image'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clear = () => {
    setSelectedFile(null);
    setProcessedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="h-full flex flex-col gap-6 overflow-y-auto">
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <div className="flex items-center gap-3 mb-2">
          <Layers className="w-6 h-6 text-pink-500" />
          <h2 className="text-xl font-semibold text-white">Background Remover</h2>
        </div>
        <p className="text-slate-400 text-sm">
          Upload an image to isolate the subject. Powered by Gemini's vision capabilities.
        </p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
        {/* Input Side */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Original Image</h3>
          
          {!selectedFile ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 bg-slate-900 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center p-8 cursor-pointer hover:border-pink-500/50 hover:bg-slate-800/50 transition-all group"
            >
              <div className="bg-slate-800 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-slate-400 group-hover:text-pink-400" />
              </div>
              <p className="text-slate-300 font-medium">Click to upload image</p>
              <p className="text-slate-500 text-xs mt-2">JPG, PNG, WEBP supported</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
            </div>
          ) : (
            <div className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-4 relative flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-slate-300 truncate max-w-[200px]">{selectedFile.name}</span>
                <button onClick={clear} className="text-slate-500 hover:text-red-400 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="relative flex-1 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] rounded-lg overflow-hidden flex items-center justify-center bg-slate-800">
                 <img 
                   src={`data:${selectedFile.mimeType};base64,${selectedFile.data}`} 
                   alt="Original" 
                   className="max-w-full max-h-full object-contain"
                 />
              </div>

              <button
                onClick={handleRemoveBackground}
                disabled={loading}
                className="w-full mt-4 bg-pink-600 hover:bg-pink-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium py-3 rounded-lg transition-all flex justify-center items-center gap-2 shadow-lg shadow-pink-900/20"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Layers className="w-5 h-5" />}
                Remove Background
              </button>
            </div>
          )}
        </div>

        {/* Output Side */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Processed Result</h3>
          
          <div className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-4 flex flex-col">
            {processedImage ? (
              <>
                <div className="flex-1 relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center border border-slate-700">
                  <img 
                    src={`data:image/png;base64,${processedImage}`} 
                    alt="Processed" 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <button
                  onClick={handleDownload}
                  className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-lg transition-all flex justify-center items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download PNG
                </button>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600 opacity-50">
                {loading ? (
                   <div className="text-center">
                     <Loader2 className="w-12 h-12 mb-4 animate-spin text-pink-500" />
                     <p>Processing image...</p>
                   </div>
                ) : (
                   <>
                     <ImageIcon className="w-16 h-16 mb-4" />
                     <p>Result will appear here</p>
                   </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackgroundRemover;