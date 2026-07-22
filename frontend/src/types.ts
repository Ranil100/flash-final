export interface AtsScanResult {
  matchScore: number;
  keywords: {
    optimal: string[];
    missing: string[];
    overused: string[];
  };
  formattingRating: string;
  formattingFeedback: string;
  improvements: Array<{
    category: string;
    tip: string;
    impact: string;
  }>;
  readinessScore: number;
  profileAnalysis: string;
  companyFit: Array<{
    companyType: string;
    selectionLikelihood: string;
    bestFor: string;
    reason: string;
  }>;
}

export interface InterviewQuestion {
  questionNumber: number;
  questionText: string;
  codeSnippet: string;
  difficulty: string;
  aiFocusTips: string;
}

export interface InterviewHistoryItem {
  questionText: string;
  userResponse: string;
  difficulty: string;
  aiFocusTips: string;
  codeSnippet?: string;
}

export interface InterviewEvaluation {
  overallScore: number;
  breakdown: {
    correctness: number;
    structure: number;
    communication: number;
    problemSolving: number;
  };
  overallVerdict: string;
  questionReviews: Array<{
    questionNumber: number;
    questionText: string;
    userResponse: string;
    exemplaryAnswer: string;
    strengths: string[];
    improvements: string[];
  }>;
}

export type ViewType = 'landing' | 'ats' | 'coding' | 'mock-setup' | 'mock-active' | 'mock-feedback' | 'interview-report';
