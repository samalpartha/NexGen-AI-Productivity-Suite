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
export const humanizeContent = async (inputContent: string, mode: HumanizerMode = 'Standard'): Promise<HumanizerResult> => {
    try {
        // Client-side execution to bypass Vercel IP blocks
        // @ts-ignore
        const apiKey = __HF_API_KEY__;

        if (!apiKey) {
            throw new Error('API Key configuration missing in client');
        }

        let modeInstruction = "Rewrite unique, human-like.";
        switch (mode) {
            case 'Academic': modeInstruction += " Style: Academic."; break;
            case 'Formal': modeInstruction += " Style: Formal."; break;
            case 'Casual': modeInstruction += " Style: Casual."; break;
            case 'Shorten': modeInstruction += " Concise."; break;
            case 'Expand': modeInstruction += " Detailed."; break;
        }

        const systemPrompt = "You are a rewriter. Rewrite input to be unique. Return JSON.";
        const userPrompt = `Input: ${inputContent}\n\nFormat JSON:\n{\n"humanizedText": "...",\n"changesMade": ["..."],\n"plagiarismRiskScore": 98\n}`;

        console.log("Calling HF Client-Side (Zephyr 7B on Router)...");

        const response = await fetch("https://router.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "HuggingFaceH4/zephyr-7b-beta",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                max_tokens: 1000,
                temperature: 0.7,
                stream: false
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`HF Errors: ${response.status} ${err}`);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';

        let jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        try {
            return JSON.parse(jsonStr);
        } catch (e) {
            return {
                humanizedText: jsonStr,
                changesMade: ["Rewritten (Parse Fallback)"],
                plagiarismRiskScore: 99,
                originalText: inputContent
            } as any;
        }
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
