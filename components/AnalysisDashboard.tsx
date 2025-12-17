import React, { useState, useEffect } from 'react';
import { AnalysisResult, Candidate, ShortlistingCategory } from '../types';
import { 
  CheckCircle, AlertTriangle, XCircle, User, Star, ChevronRight, Mail, ClipboardList, Briefcase, FileText, Send, Copy, Check, Loader2, X, ArrowRight, SkipForward, AtSign
} from 'lucide-react';

interface AnalysisDashboardProps {
  results: AnalysisResult;
}

const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ results }) => {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(results.candidates[0] || null);
  const [sentCandidates, setSentCandidates] = useState<Set<string>>(new Set());
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Batch Email State
  const [emailQueue, setEmailQueue] = useState<Candidate[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [editedEmail, setEditedEmail] = useState('');

  // Update edited email when queue advances
  useEffect(() => {
    if (isQueueOpen && emailQueue[currentQueueIndex]) {
      setEditedEmail(emailQueue[currentQueueIndex].email || '');
    }
  }, [currentQueueIndex, emailQueue, isQueueOpen]);

  // Helper for status badge
  const StatusBadge = ({ category }: { category: ShortlistingCategory }) => {
    let colorClass = "";
    switch (category) {
      case ShortlistingCategory.STRONGLY_SHORTLISTED: colorClass = "bg-green-100 text-green-800 border-green-200"; break;
      case ShortlistingCategory.SHORTLISTED: colorClass = "bg-blue-100 text-blue-800 border-blue-200"; break;
      case ShortlistingCategory.BACKUP: colorClass = "bg-amber-100 text-amber-800 border-amber-200"; break;
      case ShortlistingCategory.REJECTED: colorClass = "bg-red-100 text-red-800 border-red-200"; break;
    }
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
        {category}
      </span>
    );
  };

  const markAsSent = (candidateId: string) => {
    setSentCandidates(prev => {
      const newSet = new Set(prev);
      newSet.add(candidateId);
      return newSet;
    });
  };

  const handleOpenMailClient = (candidate: Candidate, specificEmail?: string) => {
    const targetEmail = specificEmail !== undefined ? specificEmail : candidate.email;
    const subject = encodeURIComponent(candidate.evaluation.emailSubject);
    const body = encodeURIComponent(candidate.evaluation.emailBody);
    const mailtoUrl = `mailto:${targetEmail}?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;
    markAsSent(candidate.id);
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // --- Batch Queue Logic ---

  const startBatch = (candidates: Candidate[]) => {
    if (candidates.length === 0) return;
    setEmailQueue(candidates);
    setCurrentQueueIndex(0);
    setIsQueueOpen(true);
  };

  const handleSendShortlisted = () => {
    const queue = results.candidates.filter(c => 
      c.category !== ShortlistingCategory.REJECTED && 
      !sentCandidates.has(c.id)
    );

    if (queue.length === 0) {
      alert("No pending shortlisted candidates to email.");
      return;
    }
    startBatch(queue);
  };

  const handleSendRejected = () => {
    const queue = results.candidates.filter(c => 
      c.category === ShortlistingCategory.REJECTED && 
      !sentCandidates.has(c.id)
    );

    if (queue.length === 0) {
      alert("No pending rejected candidates to email.");
      return;
    }
    startBatch(queue);
  };

  const handleQueueAction = (action: 'send' | 'skip') => {
    const candidate = emailQueue[currentQueueIndex];
    
    if (action === 'send') {
      handleOpenMailClient(candidate, editedEmail);
    }

    if (currentQueueIndex < emailQueue.length - 1) {
      setCurrentQueueIndex(prev => prev + 1);
    } else {
      setIsQueueOpen(false);
      setEmailQueue([]);
      alert("Batch processing complete!");
    }
  };

  const closeQueue = () => {
    if (window.confirm("Stop sending emails? Progress on sent emails is saved.")) {
      setIsQueueOpen(false);
      setEmailQueue([]);
    }
  };

  // Helper to render the queue modal
  const renderQueueModal = () => {
    if (!isQueueOpen || emailQueue.length === 0) return null;
    
    const candidate = emailQueue[currentQueueIndex];
    const isRejected = candidate.category === ShortlistingCategory.REJECTED;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 rounded-t-xl">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Review Email {currentQueueIndex + 1} of {emailQueue.length}
              </h3>
              <p className="text-sm text-slate-500">
                {isRejected ? 'Rejection' : 'Shortlist'} • {candidate.name}
              </p>
            </div>
            <button 
              onClick={closeQueue}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
            >
              <X size={20} />
            </button>
          </div>

          {/* Modal Content - Scrollable */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            
            {/* Email To Field */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Recipient Email</label>
              <div className="flex items-center">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={16} className="text-slate-400" />
                  </div>
                  <input 
                    type="email"
                    value={editedEmail}
                    onChange={(e) => setEditedEmail(e.target.value)}
                    placeholder="candidate@example.com"
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
              </div>
              {!editedEmail && (
                <p className="text-xs text-amber-600 flex items-center">
                  <AlertTriangle size={12} className="mr-1" />
                  Email not found in resume. Please enter manually.
                </p>
              )}
            </div>
            
            <div className="space-y-1">
               <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</span>
                  <button onClick={() => handleCopy(candidate.evaluation.emailSubject, 'modal-subj')} className="text-slate-400 hover:text-blue-600">
                    {copiedField === 'modal-subj' ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>}
                  </button>
               </div>
               <div className="p-3 bg-slate-50 border border-slate-200 rounded text-sm font-medium text-slate-900">
                 {candidate.evaluation.emailSubject}
               </div>
            </div>

            <div className="space-y-1">
               <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Message Body</span>
                  <button onClick={() => handleCopy(candidate.evaluation.emailBody, 'modal-body')} className="text-slate-400 hover:text-blue-600">
                    {copiedField === 'modal-body' ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>}
                  </button>
               </div>
               <div className="p-4 bg-slate-50 border border-slate-200 rounded text-sm font-mono text-slate-700 whitespace-pre-wrap h-64 overflow-y-auto leading-relaxed">
                 {candidate.evaluation.emailBody}
               </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-between items-center">
             <div className="text-xs text-slate-400 hidden sm:block">
               Opens default email client.
             </div>
             <div className="flex space-x-3 w-full sm:w-auto justify-end">
               <button 
                 onClick={() => handleQueueAction('skip')}
                 className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors flex items-center"
               >
                 <SkipForward size={16} className="mr-2"/>
                 Skip
               </button>
               <button 
                 onClick={() => handleQueueAction('send')}
                 disabled={!editedEmail}
                 className={`px-6 py-2 text-sm font-bold text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center ${
                    !editedEmail ? 'bg-slate-400 cursor-not-allowed' :
                    isRejected ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                 }`}
               >
                 <Send size={16} className="mr-2"/>
                 {currentQueueIndex === emailQueue.length - 1 ? 'Send & Finish' : 'Send & Next'}
               </button>
             </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      {renderQueueModal()}

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500">Processed</p>
          <p className="text-2xl font-bold text-slate-800">{results.summary.processedCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500">Shortlisted</p>
          <p className="text-2xl font-bold text-green-600">{results.summary.shortlistedCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500">Cutoff Score</p>
          <p className="text-2xl font-bold text-blue-600">{results.summary.recommendedCutoff}%</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500">Duplicates Removed</p>
          <p className="text-2xl font-bold text-amber-600">{results.summary.duplicateCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[800px]">
        {/* Left Column: Candidate List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-slate-800 flex items-center">
                <User size={18} className="mr-2 text-slate-500" /> Candidates
              </h3>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={handleSendShortlisted}
                className="flex-1 text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-2 rounded-md transition-colors flex items-center justify-center"
                title="Review and send emails to shortlisted candidates"
              >
                <ClipboardList size={14} className="mr-1.5" />
                Review Shortlisted
              </button>
              <button 
                onClick={handleSendRejected}
                className="flex-1 text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 px-2 py-2 rounded-md transition-colors flex items-center justify-center"
                title="Review and send emails to rejected candidates"
              >
                <ClipboardList size={14} className="mr-1.5" />
                Review Rejected
              </button>
            </div>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {results.candidates.sort((a, b) => b.score - a.score).map((candidate) => (
              <div 
                key={candidate.id}
                onClick={() => setSelectedCandidate(candidate)}
                className={`p-3 rounded-lg cursor-pointer transition-all border ${
                  selectedCandidate?.id === candidate.id 
                    ? 'bg-blue-50 border-blue-200 shadow-sm' 
                    : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-slate-800 truncate">{candidate.name}</span>
                  <span className={`text-xs font-bold ${candidate.score >= 70 ? 'text-green-600' : 'text-slate-500'}`}>
                    {candidate.score}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                   <div className="flex items-center space-x-2">
                     <StatusBadge category={candidate.category} />
                     {sentCandidates.has(candidate.id) && (
                       <span className="text-xs text-green-600 flex items-center" title="Email sent">
                         <Mail size={12} className="mr-1" /> Sent
                       </span>
                     )}
                   </div>
                   <ChevronRight size={14} className="text-slate-300" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Detailed View */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 h-full overflow-y-auto">
          {selectedCandidate ? (
            <div className="p-8 space-y-8">
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 pb-6 border-b border-slate-100">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">{selectedCandidate.name}</h2>
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-3 text-sm text-slate-500">
                      <span className="flex items-center"><FileText size={14} className="mr-1"/> {selectedCandidate.filename}</span>
                      <span>•</span>
                      <span className="flex items-center"><Briefcase size={14} className="mr-1"/> ID: {selectedCandidate.id}</span>
                    </div>
                    {selectedCandidate.email ? (
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <Mail size={14} className="text-slate-400"/>
                        <span>{selectedCandidate.email}</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-sm text-amber-600">
                        <AlertTriangle size={14}/>
                        <span>Email not extracted</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                   <div className="text-4xl font-bold text-blue-600 mb-1">{selectedCandidate.score}%</div>
                   <div className="text-sm text-slate-500 uppercase tracking-wide font-medium">Match Score</div>
                </div>
              </div>

              {/* Assessment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                   <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
                      <Star size={18} className="mr-2 text-yellow-500" /> Key Strengths
                   </h4>
                   <ul className="space-y-2">
                     {selectedCandidate.evaluation.strengths.map((s, i) => (
                       <li key={i} className="flex items-start text-sm text-slate-700">
                         <CheckCircle size={16} className="mr-2 text-green-500 mt-0.5 shrink-0" />
                         {s}
                       </li>
                     ))}
                   </ul>
                </div>
                <div>
                   <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
                      <AlertTriangle size={18} className="mr-2 text-amber-500" /> Gaps & Risks
                   </h4>
                   <ul className="space-y-2">
                     {selectedCandidate.evaluation.gaps.map((s, i) => (
                       <li key={i} className="flex items-start text-sm text-slate-700">
                         <XCircle size={16} className="mr-2 text-amber-500 mt-0.5 shrink-0" />
                         {s}
                       </li>
                     ))}
                   </ul>
                </div>
              </div>

              {/* Startup Fit */}
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-100">
                 <h4 className="font-semibold text-slate-900 mb-2">Startup Fit Assessment</h4>
                 <p className="text-slate-700 text-sm leading-relaxed">{selectedCandidate.evaluation.startupFit}</p>
              </div>

              {/* Interview Questions */}
              {selectedCandidate.evaluation.interviewQuestions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-4 flex items-center">
                    <ClipboardList size={18} className="mr-2 text-indigo-500" /> Recommended Interview Questions
                  </h4>
                  <div className="space-y-3">
                    {selectedCandidate.evaluation.interviewQuestions.map((q, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold mt-0.5">
                          {i + 1}
                        </div>
                        <p className="text-slate-700 text-sm">{q}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

               {/* Individual Email Draft */}
               <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                  <div className={`px-4 py-3 border-b border-slate-200 flex items-center justify-between ${
                    selectedCandidate.category === ShortlistingCategory.REJECTED ? 'bg-red-50' : 'bg-slate-50'
                  }`}>
                     <div className="flex items-center">
                       <Mail size={16} className={`mr-2 ${selectedCandidate.category === ShortlistingCategory.REJECTED ? 'text-red-500' : 'text-slate-500'}`} />
                       <span className="text-sm font-medium text-slate-700">
                         {selectedCandidate.category === ShortlistingCategory.REJECTED ? 'Rejection Email Draft' : 'Shortlist Email Draft'}
                       </span>
                     </div>
                     <div className="flex space-x-2">
                       <button 
                         onClick={() => handleCopy(selectedCandidate.evaluation.emailBody, 'body')}
                         className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                       >
                         {copiedField === 'body' ? <Check size={12} className="text-green-500"/> : <Copy size={12}/>}
                         <span>Copy Body</span>
                       </button>
                       <button 
                         onClick={() => handleOpenMailClient(selectedCandidate)}
                         className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                           sentCandidates.has(selectedCandidate.id)
                             ? 'bg-green-100 text-green-700 border border-green-200'
                             : selectedCandidate.category === ShortlistingCategory.REJECTED
                               ? 'bg-white text-red-600 border border-red-200 hover:bg-red-50'
                               : 'bg-blue-600 text-white border border-blue-600 hover:bg-blue-700'
                         }`}
                       >
                         {sentCandidates.has(selectedCandidate.id) ? (
                           <>
                             <Check size={12} />
                             <span>Sent</span>
                           </>
                         ) : (
                           <>
                             <Send size={12} />
                             <span>Open Mail App</span>
                           </>
                         )}
                       </button>
                     </div>
                  </div>
                  <div className="p-4 bg-white relative group">
                    <div className="mb-4">
                       <div className="flex items-center justify-between mb-1">
                         <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</span>
                         <button 
                           onClick={() => handleCopy(selectedCandidate.evaluation.emailSubject, 'subject')}
                           className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded"
                           title="Copy Subject"
                         >
                           {copiedField === 'subject' ? <Check size={12} className="text-green-500"/> : <Copy size={12} className="text-slate-400"/>}
                         </button>
                       </div>
                       <div className="text-sm text-slate-900 border border-slate-200 rounded px-3 py-2 bg-slate-50">
                         {selectedCandidate.evaluation.emailSubject}
                       </div>
                    </div>
                    <div>
                       <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Body</span>
                       <div className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed font-mono bg-slate-50 p-3 rounded border border-slate-200">
                         {selectedCandidate.evaluation.emailBody}
                       </div>
                    </div>
                  </div>
               </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              Select a candidate to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisDashboard;