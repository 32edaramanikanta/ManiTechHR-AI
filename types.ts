export interface JobContext {
  roleTitle: string;
  description: string;
  context: string; // Industry, stage, team size, etc.
}

export enum ShortlistingCategory {
  STRONGLY_SHORTLISTED = "Strongly Shortlisted",
  SHORTLISTED = "Shortlisted",
  BACKUP = "Backup",
  REJECTED = "Rejected"
}

export interface CandidateEvaluation {
  summary: string;
  strengths: string[];
  gaps: string[];
  redFlags: string[];
  startupFit: string;
  interviewQuestions: string[];
  emailSubject: string;
  emailBody: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string; // Extracted email address
  score: number;
  category: ShortlistingCategory;
  evaluation: CandidateEvaluation;
  filename: string;
}

export interface AnalysisResult {
  summary: {
    processedCount: number;
    duplicateCount: number;
    shortlistedCount: number;
    rejectedCount: number;
    recommendedCutoff: number;
  };
  candidates: Candidate[];
}

export type ProcessingStatus = 'idle' | 'processing' | 'complete' | 'error';