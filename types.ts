export enum ActiveTool {
  RESUME_OPTIMIZER = 'RESUME_OPTIMIZER',
  CONTENT_HUMANIZER = 'CONTENT_HUMANIZER',
  SEO_ANALYZER = 'SEO_ANALYZER',
  BACKGROUND_REMOVER = 'BACKGROUND_REMOVER',
  LATEX_CONVERTER = 'LATEX_CONVERTER'
}

export type HumanizerMode = 'Standard' | 'Formal' | 'Casual' | 'Shorten' | 'Expand' | 'Academic';

export interface AtsAnalysisResult {
  matchScore: number;
  missingKeywords: string[];
  formattingIssues: string[];
  suggestions: string[];
  summary: string;
}

export interface SeoAnalysisResult {
  seoScore: number;
  readabilityScore: number;
  metaDescription: string;
  keywordDensity: string;
  loadingSpeedQualitative: string;
  improvementChecklist: string[];
}

export interface HumanizerResult {
  originalText: string;
  humanizedText: string;
  changesMade: string[];
  plagiarismRiskScore: number; // Simulated score based on text complexity
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}