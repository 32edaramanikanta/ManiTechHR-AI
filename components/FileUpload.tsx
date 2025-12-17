import React, { useRef } from 'react';
import { Upload, X, FileText } from 'lucide-react';

interface FileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ files, onFilesChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      onFilesChange([...files, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  return (
    <div className="space-y-4">
      <div 
        className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          multiple 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange}
          accept=".pdf,.txt,.docx"
        />
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
            <Upload size={24} />
          </div>
          <p className="text-sm font-medium text-slate-700">Click to upload resumes</p>
          <p className="text-xs text-slate-500">PDF, DOCX, TXT supported</p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-md shadow-sm">
              <div className="flex items-center space-x-3">
                <FileText size={18} className="text-slate-400" />
                <span className="text-sm text-slate-700 truncate max-w-[200px]">{file.name}</span>
                <span className="text-xs text-slate-400">({(file.size / 1024).toFixed(0)}kb)</span>
              </div>
              <button 
                onClick={() => removeFile(index)} 
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;