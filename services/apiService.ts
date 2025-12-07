// Frontend API service to call backend endpoints
// This replaces direct Gemini API calls from the client

const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : '/api';

export type ResumeInput = string | { mimeType: string; data: string };

interface AtsAnalysisResult {
    matchScore: number;
    missingKeywords: string[];
    formattingIssues: string[];
    suggestions: string[];
    summary: string;
}

interface HumanizerResult {
    humanizedText: string;
    changesMade: string[];
    plagiarismRiskScore: number;
    originalText: string;
}

interface SeoAnalysisResult {
    seoScore: number;
    readabilityScore: number;
    metaDescription: string;
    keywordDensity: string;
    loadingSpeedQualitative: string;
    improvementChecklist: string[];
}

export type HumanizerMode = 'Standard' | 'Academic' | 'Formal' | 'Casual' | 'Shorten' | 'Expand';

/**
 * Analyze resume against job description
 */
export const analyzeResume = async (resumeInput: ResumeInput, jobDescription: string): Promise<AtsAnalysisResult> => {
    try {
        const response = await fetch(`${API_BASE_URL}/analyze-resume`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ resumeInput, jobDescription }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Resume analysis failed');
        }

        return await response.json();
    } catch (error: any) {
        console.error('Resume analysis error:', error);
        throw error;
    }
};

/**
 * Humanize content to bypass AI detection
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

export const humanizeContent = async (inputContent: string, mode: HumanizerMode = 'Standard', apiKeyOverride?: string): Promise<HumanizerResult> => {
    try {
        console.log("Using Google Gemini (Client-Side)...");
        // @ts-ignore
        const envKey = typeof __GEMINI_API_KEY__ !== 'undefined' ? __GEMINI_API_KEY__ : '';
        const apiKey = apiKeyOverride || envKey;

        if (!apiKey) {
            throw new Error("MISSING_API_KEY");
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Rewrite the following text to bypass AI detection and make it 100% unique and human-like.
        
        Mode: ${mode}
        
        Input Text:
        ${inputContent}
        
        Return ONLY valid JSON in this format:
        {
          "humanizedText": "The rewritten text...",
          "changesMade": ["List of changes..."],
          "plagiarismRiskScore": 99
        }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean JSON
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(text);

    } catch (error: any) {
        console.error('Humanization error:', error);
        throw error;
    }
};

/**
 * Analyze SEO for content or URL
 */
export const analyzeSeo = async (contentOrUrl: string, targetKeyword: string, isUrl: boolean): Promise<SeoAnalysisResult> => {
    try {
        const response = await fetch(`${API_BASE_URL}/analyze-seo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ contentOrUrl, targetKeyword, isUrl }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'SEO analysis failed');
        }

        return await response.json();
    } catch (error: any) {
        console.error('SEO analysis error:', error);
        throw error;
    }
};

/**
 * Remove background from image
 */
export const removeImageBackground = async (imageBase64: string, mimeType: string): Promise<string> => {
    try {
        const response = await fetch(`${API_BASE_URL}/remove-background`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageBase64, mimeType }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Background removal failed');
        }

        const result = await response.json();
        return result.imageData;
    } catch (error: any) {
        console.error('Background removal error:', error);
        throw error;
    }
};

/**
 * Convert document between formats
 */
export const convertDocument = async (
    input: string | { mimeType: string; data: string },
    targetFormat: 'latex' | 'docx'
): Promise<string> => {
    try {
        const response = await fetch(`${API_BASE_URL}/convert-document`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ input, targetFormat }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Document conversion failed');
        }

        const result = await response.json();
        return result.convertedText;
    } catch (error: any) {
        console.error('Document conversion error:', error);
        throw error;
    }
};

/**
 * Generate cover letter (uses resume analysis endpoint)
 */
export const generateCoverLetter = async (resumeInput: ResumeInput, jobDescription: string): Promise<string> => {
    // This would need a separate endpoint, but for now we can use a simple implementation
    // or add it to the analyze-resume endpoint
    return "Cover letter generation will be implemented in a future update.";
};
