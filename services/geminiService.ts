import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AtsAnalysisResult, SeoAnalysisResult, HumanizerResult } from "../types";

// Initialize the client. API_KEY is strictly from process.env
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Agent 1: ATS Resume Scanner
 * Uses Gemini 2.5 Flash for fast, structured JSON parsing of resumes.
 */
export const analyzeResume = async (resumeText: string, jobDescription: string): Promise<AtsAnalysisResult> => {
  const modelId = "gemini-2.5-flash";
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      matchScore: { type: Type.NUMBER, description: "A score from 0 to 100 indicating fit for the job." },
      missingKeywords: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING }, 
        description: "List of critical keywords found in job description but missing in resume." 
      },
      formattingIssues: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "List of potential formatting issues (e.g., complex tables, lack of headers)."
      },
      suggestions: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Actionable advice to improve the resume."
      },
      summary: { type: Type.STRING, description: "A brief executive summary of the analysis." }
    },
    required: ["matchScore", "missingKeywords", "suggestions", "summary", "formattingIssues"]
  };

  const prompt = `
    You are an expert ATS (Applicant Tracking System) algorithm. 
    Analyze the following Resume against the Job Description.
    
    JOB DESCRIPTION:
    ${jobDescription}

    RESUME TEXT:
    ${resumeText}

    Provide a strict JSON output evaluating the resume's compliance and fit.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.2, // Low temperature for consistent scoring
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as AtsAnalysisResult;
  } catch (error) {
    console.error("ATS Analysis failed:", error);
    throw error;
  }
};

/**
 * Agent 2: Content Humanizer & Plagiarism Remover
 * Uses Gemini 2.5 Flash to rewrite text with high perplexity and burstiness to mimic human writing.
 */
export const humanizeContent = async (inputContent: string): Promise<HumanizerResult> => {
  const modelId = "gemini-2.5-flash";

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      humanizedText: { type: Type.STRING, description: "The rewritten content." },
      changesMade: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING }, 
        description: "List of key stylistic changes made (e.g., 'Varied sentence length', 'Replaced repeated adjectives')." 
      },
      plagiarismRiskScore: { type: Type.NUMBER, description: "Estimated percentage (0-100) of detection risk reduction." }
    },
    required: ["humanizedText", "changesMade", "plagiarismRiskScore"]
  };

  const prompt = `
    You are a professional editor and ghostwriter. Your task is to "humanize" the provided text.
    The goal is to remove patterns typical of AI generation (repetitive structure, overuse of transition words like 'Moreover', 'In conclusion', flat tone).
    
    1. Rewrite the text to have varied sentence length (burstiness).
    2. Use more natural synonyms and idioms where appropriate.
    3. Maintain the original meaning but make it flow like a human wrote it.
    4. Ensure it sounds professional but authentic.

    INPUT TEXT:
    ${inputContent}
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.7, // Higher temperature for creativity
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    const result = JSON.parse(text);
    return { ...result, originalText: inputContent };
  } catch (error) {
    console.error("Humanization failed:", error);
    throw error;
  }
};

/**
 * Agent 3: Advanced SEO Analyzer
 * Uses Gemini 3 Pro Preview with Google Search Grounding to analyze live URLs or raw content.
 */
export const analyzeSeo = async (contentOrUrl: string, targetKeyword: string, isUrl: boolean): Promise<SeoAnalysisResult> => {
  // Use Gemini 3 Pro for complex reasoning and search capabilities
  const modelId = "gemini-3-pro-preview";

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      seoScore: { type: Type.NUMBER, description: "Overall SEO score 0-100." },
      readabilityScore: { type: Type.NUMBER, description: "Readability score 0-100." },
      metaDescription: { type: Type.STRING, description: "Analysis of the meta description or a suggested one." },
      keywordDensity: { type: Type.STRING, description: "Comment on keyword usage." },
      loadingSpeedQualitative: { type: Type.STRING, description: "Estimated performance assessment based on content structure (if URL)." },
      improvementChecklist: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING }, 
        description: "RankMath-style checklist of things to fix." 
      }
    },
    required: ["seoScore", "readabilityScore", "metaDescription", "keywordDensity", "improvementChecklist", "loadingSpeedQualitative"]
  };

  let prompt = "";
  let tools = [];

  if (isUrl) {
    prompt = `
      Analyze the SEO performance of this website URL: ${contentOrUrl} for the target keyword: "${targetKeyword}".
      Focus on:
      1. Content relevance and depth.
      2. Keyword usage in headers and body.
      3. Mobile friendliness indicators (based on structure).
      4. Suggest technical improvements like PageSpeed insights would (e.g. image optimization, script blocking).
    `;
    // Enable Google Search to actually visit/learn about the page context
    tools = [{ googleSearch: {} }];
  } else {
    prompt = `
      Analyze the following text content for SEO optimization regarding the target keyword: "${targetKeyword}".
      Act like the RankMath plugin.
      
      CONTENT:
      ${contentOrUrl}
    `;
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: tools,
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as SeoAnalysisResult;
  } catch (error) {
    console.error("SEO Analysis failed:", error);
    throw error;
  }
};

/**
 * Helper: Generate Cover Letter
 */
export const generateCoverLetter = async (resumeText: string, jobDescription: string): Promise<string> => {
  const modelId = "gemini-2.5-flash";
  const prompt = `
    Write a professional, persuasive cover letter based on the following Resume and Job Description.
    Keep it concise (under 300 words). Focus on matching specific skills to the requirements.

    JOB DESCRIPTION:
    ${jobDescription}

    RESUME:
    ${resumeText}
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });
    return response.text || "Could not generate cover letter.";
  } catch (error) {
    console.error("Cover letter generation failed:", error);
    return "Error generating cover letter. Please try again.";
  }
};
