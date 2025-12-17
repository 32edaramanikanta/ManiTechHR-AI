import React, { useState } from 'react';
import { JobContext, AnalysisResult, ProcessingStatus } from './types';
import { analyzeResumes } from './services/geminiService';
import FileUpload from './components/FileUpload';
import AnalysisDashboard from './components/AnalysisDashboard';
import { Sparkles, Briefcase, Building, Key } from 'lucide-react';

const App: React.FC = () => {
  const [jobContext, setJobContext] = useState<JobContext>({
    roleTitle: '',
    description: '',
    context: ''
  });
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleContextChange = (field: keyof JobContext, value: string) => {
    setJobContext(prev => ({ ...prev, [field]: value }));
  };

  const startAnalysis = async () => {
    if (files.length === 0) {
      setErrorMsg("Please upload at least one resume");
      return;
    }
    if (!jobContext.description) {
      setErrorMsg("Job Description is required");
      return;
    }

    setStatus('processing');
    setErrorMsg(null);

    try {
      const data = await analyzeResumes(
        jobContext.roleTitle,
        jobContext.description,
        jobContext.context,
        files
      );
      setResults(data);
      setStatus('complete');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || "An unexpected error occurred");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">StartupHire AI</h1>
          </div>
          <div className="flex items-center space-x-4">
             {/* Simple visual indicator of status */}
             {status === 'processing' && (
               <span className="flex items-center text-sm text-blue-600 animate-pulse">
                 Processing {files.length} resumes...
               </span>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {status === 'idle' || status === 'error' || status === 'processing' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Input Form */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Job Details */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                  <Briefcase size={20} className="mr-2 text-slate-500" /> Role Details
                </h2>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Role Title</label>
                  <input
                    type="text"
                    value={jobContext.roleTitle}
                    onChange={(e) => handleContextChange('roleTitle', e.target.value)}
                    placeholder="e.g. Senior React Engineer"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Job Description (JD)</label>
                  <textarea
                    value={jobContext.description}
                    onChange={(e) => handleContextChange('description', e.target.value)}
                    placeholder="Paste the full job description here..."
                    rows={6}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                  />
                </div>
              </div>

               {/* Startup Context */}
               <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                  <Building size={20} className="mr-2 text-slate-500" /> Startup Context
                </h2>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Context</label>
                  <textarea
                    value={jobContext.context}
                    onChange={(e) => handleContextChange('context', e.target.value)}
                    placeholder="e.g. Seed stage, Fintech, team of 5, need someone who can ship fast..."
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                  />
                </div>
              </div>
            </div>

            {/* File Upload & Action */}
            <div className="lg:col-span-7 flex flex-col h-full">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Resume Upload</h2>
                <div className="flex-1">
                  <FileUpload files={files} onFilesChange={setFiles} />
                </div>
                
                {errorMsg && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
                    {errorMsg}
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-slate-100">
                  <button
                    onClick={startAnalysis}
                    disabled={status === 'processing'}
                    className={`w-full py-4 px-6 rounded-lg font-semibold text-lg shadow-md transition-all flex items-center justify-center ${
                      status === 'processing'
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg active:transform active:scale-[0.98]'
                    }`}
                  >
                    {status === 'processing' ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing Resumes...
                      </>
                    ) : (
                      'Run AI Analysis'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Results View */
          <div className="space-y-6">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Analysis Results</h2>
                <button 
                  onClick={() => { setResults(null); setStatus('idle'); setFiles([]); }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Start New Session
                </button>
             </div>
             {results && <AnalysisDashboard results={results} />}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;