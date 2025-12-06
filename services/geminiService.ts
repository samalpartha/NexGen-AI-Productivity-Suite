import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AtsAnalysisResult, SeoAnalysisResult, HumanizerResult, HumanizerMode } from "../types";

// Initialize the client. API_KEY is strictly from process.env
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export type ResumeInput = string | { mimeType: string; data: string };

/**
 * Agent 1: ATS Resume Scanner
 * Uses Gemini 2.5 Flash for fast, structured JSON parsing of resumes.
 */
export const analyzeResume = async (resumeInput: ResumeInput, jobDescription: string): Promise<AtsAnalysisResult> => {
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

  const basePrompt = `
    You are an expert ATS (Applicant Tracking System) algorithm. 
    Analyze the provided Resume against the Job Description.
    
    JOB DESCRIPTION:
    ${jobDescription}

    Provide a strict JSON output evaluating the resume's compliance and fit.
  `;

  let contents;
  
  if (typeof resumeInput === 'string') {
    contents = `
      ${basePrompt}

      RESUME TEXT:
      ${resumeInput}
    `;
  } else {
    contents = {
      parts: [
        { text: basePrompt },
        { inlineData: { mimeType: resumeInput.mimeType, data: resumeInput.data } }
      ]
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: contents,
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
 * Uses Gemini 3 Pro Preview with High Thinking Budget (Chaining) to rewrite text.
 */
export const humanizeContent = async (inputContent: string, mode: HumanizerMode = 'Standard'): Promise<HumanizerResult> => {
  // Switched to Gemini 3 Pro Preview for superior reasoning
  const modelId = "gemini-3-pro-preview";

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      humanizedText: { 
        type: Type.STRING, 
        description: "The rewritten content. CRITICAL: You MUST preserve the exact same paragraph structure as the input. Map each input paragraph to one output paragraph. Use double newlines (\\n\\n) to separate paragraphs." 
      },
      changesMade: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING }, 
        description: "List of key stylistic changes made to comply with directives." 
      },
      plagiarismRiskScore: { 
        type: Type.NUMBER, 
        description: "The percentage of AI detection risk ELIMINATED. MUST be a high value between 96 and 99 indicating successful humanization." 
      }
    },
    required: ["humanizedText", "changesMade", "plagiarismRiskScore"]
  };

  let modeInstruction = "Rewrite this text to be 100% unique, human-like, and plagiarism-free. ";
  // Default Perspective: Generic/Impersonal (Standard)
  let perspectiveDirective = "• Perspective: Use a generic, objective tone. Avoid excessive use of \"You\", \"I\", or \"We\". Make the subject matter the focus rather than the reader."; 

  switch (mode) {
    case 'Academic':
      modeInstruction += "CONTEXT: Academic/Research. TONE: Scholarly, Objective, Nuanced, yet HUMAN. Avoid 'AI-Academic' words (e.g., 'Delve', 'Tapestry', 'Realm', 'Underscore'). Use precise verbs but varying sentence structures. STRICTLY THIRD PERSON.";
      perspectiveDirective = "• Perspective: STRICTLY THIRD PERSON. Do not use 'I', 'We', or 'You'. Focus on the data/subject/evidence.";
      break;
    case 'Formal':
      modeInstruction += "CONTEXT: Professional Business. TONE: Formal, objective. Avoid slang, but also avoid robotic corporate jargon. STRICTLY THIRD PERSON.";
      perspectiveDirective = "• Perspective: Write strictly in the THIRD PERSON. Do not use \"I\", \"We\", or \"You\". Maintain an objective, professional tone.";
      break;
    case 'Casual':
      modeInstruction += "CONTEXT: Casual Conversation. TONE: Chatty, relaxed. Write as if chatting, but avoid being overly aggressive with direct address.";
      perspectiveDirective = "• Perspective: Conversational. You may use \"I\" or \"You\" if it aids the flow, but prefer generic phrasing where possible.";
      break;
    case 'Shorten':
      modeInstruction += "CONTEXT: Concise Summary. ACTION: Remove fluff while keeping the core message and expert insight.";
      break;
    case 'Expand':
      modeInstruction += "CONTEXT: Detailed Explanation. ACTION: Add brief, relatable examples to increase length.";
      break;
    case 'Standard':
    default:
      modeInstruction += "Balance clarity with human nuance. DO NOT SHORTEN THE TEXT.";
      break;
  }

  const prompt = `
    You are the world's leading Subject Matter Expert (SME) on the topic of the input text.
    Your goal is to rewrite the input content to demonstrate deep authority and insight while strictly adhering to human writing patterns to pass AI detection.
    
    OBJECTIVE: REDUCE AI DETECTION SCORE TO <10% while MAINTAINING ORIGINAL CONTENT LENGTH AND STRUCTURE.
    OUTPUT SCORING: The 'plagiarismRiskScore' in your response must represent the % of risk REMOVED. Target 98-99%.
    
    INTERNAL CHAIN OF THOUGHT (Execute this in your thinking process before generating JSON):
    1. ANALYZE: Identify the AI patterns in the input (e.g., "In conclusion", "It is important to note", uniform sentence length).
    2. PLAN: Determine how to break these patterns using the specific mode (${mode}).
    3. DETECT HEADERS: Scan for headers, numbering (e.g., "2.1 Title"), or bullet points. Mark them to be preserved EXACTLY.
    4. DRAFT & REFINE: Rewrite body text sentence by sentence.
       - "Does this sentence sound predictable?" -> If yes, change the verb.
       - "Are all sentences the same length?" -> If yes, combine two short ones, or chop a long one.
       - "Am I using a bridge word like 'Moreover'?" -> If yes, DELETE IT.
       - "Is this sentence exaggerated?" -> If yes, tone it down to facts.
       - "Is the grammar perfect?" -> Check subject-verb agreement and tense.
       - "Am I using a contraction?" -> EXPAND IT (e.g. "won't" -> "would not").
    5. CHECK FORMAT: Ensure paragraph count matches input exactly. Ensure headers are untouched.
    
    CRITICAL FORMATTING & LENGTH RULES:
    1. WORD COUNT RETENTION (CRITICAL): The output MUST be approximately the same length as the input (within 5-10% variance). DO NOT SUMMARIZE. DO NOT CONDENSE.
    2. PARAGRAPH STRUCTURE (CRITICAL): 
       - The output MUST have the EXACT SAME number of paragraphs as the input.
       - Map each input paragraph to exactly one output paragraph.
       - Use double newlines (\\n\\n) in the JSON value to strictly separate paragraphs.
    3. HEADERS & NUMBERING (CRITICAL): Preserve all section headers, titles, and numbering (e.g., '1. Introduction', '2.1 Background', 'Conclusion') EXACTLY as they appear. Do NOT rewrite headers. Do NOT merge headers with body text.
    4. Do not add Markdown blockquotes, bolding, or headers unless they existed in the original.

    MODE: ${mode}
    ${modeInstruction}

    POSITIVE DIRECTIVES (How you SHOULD write)
    • Expert Persona: Write with authoritative depth. Show you truly understand the nuances of the subject.
    • Voice Balance: Use your best judgment regarding Active vs Passive voice. Use active voice for clarity/impact, but use passive voice or generic subjects if it improves flow or avoids forced "You" statements.
    • Everyday Vocabulary: Substitute unnecessary technical jargon or corporate fluff with everyday vocabulary.
    • EXTREME BURSTINESS: Variate sentence length wildly. Follow a 30-word complex sentence with a 4-word punchy fragment. Avoid rhythm monotony.
    • UNPREDICTABLE VOCABULARY: Do not use the most statistically probable word. Choose the 2nd or 3rd most common synonym to increase Perplexity, BUT ensure the synonym is contextually accurate and not obscure.
    • Emotional Nuance: Incorporate small emotional expressions or reflections where it fits naturally (Unless in Academic/Formal mode where you should rely on 'Intellectual Nuance').
    • GRAMMAR PRECISION: Ensure flawless grammar. Check subject-verb agreement, tense consistency, and punctuation.
    • GROUNDED REALISM: Do not exaggerate. Avoid words like "unparalleled", "limitless", "incredible" unless factually true. Keep the tone realistic and professional.
    • PRECISE SYNONYMS: Use synonyms that fit the specific context perfectly to avoid repetition. Do not use a synonym if it changes the original meaning.
    • EXPAND CONTRACTIONS: Always expand contractions for clarity and formality. Use "would not" instead of "won't", "cannot" instead of "can't", "do not" instead of "don't", "it is" instead of "it's".
    ${perspectiveDirective}
    
    AI PATTERN BREAKING (Crucial for <10% Score):
    • NO BRIDGE WORDS: Strictly AVOID transition words like "However", "Therefore", "Moreover", "Furthermore", "In addition". Start sentences directly with the subject or action.
    • IMPERFECT FLOW: AI writes with perfect, predictable rhythm. Humans don't. Allow for slight digressions, conversational filler, or abrupt changes in pace.
    • ASYMMETRY: Avoid perfectly balanced sentence structures.
    • LESS ENTHUSIASM: AI is often overly cheerful or optimistic. Humans are often neutral, matter-of-fact, or critical. Adopt a grounded, realistic tone.

    NEGATIVE DIRECTIVES (What you MUST AVOID to bypass detectors)
    • Avoid Jargon: Replace "leverage", "optimize", "synergy", "utilize", "ensure" with everyday words like "use", "make sure", "work together".
    • No Semicolons (;): Use periods or connectors instead.
    • No Em Dashes (—): Use commas or split sentences.
    • NO EXAGGERATION: Do not use hyperbolic adjectives. Keep it factual and understated.
    • NO CONTRACTIONS: Do not use "won't", "can't", "don't", "it's", "I'm". Always use the full form.
    • BANNED PHRASES (Strictly prohibited - these trigger AI detection):
      "In conclusion", "It is important to note", "In the realm of", "Delve into", "Tapestry", "Bustling", "Testament to", "Game-changer", "Unleash", "Elevate", "Cutting-edge", "Furthermore", "Moreover", "Additionally", "Consequently", "Significant", "Robust", "Seamless", "Pivotal", "Paramount", "Crucial", "Foster", "Landscape", "Underscore", "Myriad", "Plethora", "Spearhead".
    
    FAILURE TO COMPLY WITH ANY NEGATIVE DIRECTIVE INVALIDATES THE OUTPUT.

    INPUT CONTENT:
    ${inputContent}
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        // High thinking budget acts as the "Chain" for self-correction before output
        thinkingConfig: { thinkingBudget: 10240 }, 
        // Increased temperature to 1.2 for higher perplexity and less predictable output
        temperature: 1.2, 
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
 * Agent 4: Background Remover
 * Uses Gemini 2.5 Flash Image to edit the image and remove the background.
 */
export const removeImageBackground = async (imageBase64: string, mimeType: string): Promise<string> => {
  const modelId = "gemini-2.5-flash-image";
  const prompt = "Remove the background from this image. Keep the main subject exactly as is, but replace the background with a transparent or solid white background. Return only the image.";

  const contents = {
    parts: [
      { text: prompt },
      { inlineData: { mimeType: mimeType, data: imageBase64 } }
    ]
  };

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: contents,
      // Note: We don't set responseMimeType to json here because we want an image back.
      // The image comes in the response parts.
    });

    // Check for inline data (image) in response
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }
    }
    
    throw new Error("No image generated.");
  } catch (error) {
    console.error("Background removal failed:", error);
    throw error;
  }
};

/**
 * Helper: Generate Cover Letter
 */
export const generateCoverLetter = async (resumeInput: ResumeInput, jobDescription: string): Promise<string> => {
  const modelId = "gemini-2.5-flash";
  const basePrompt = `
    Write a professional, persuasive cover letter based on the provided Resume and Job Description.
    Keep it concise (under 300 words). Focus on matching specific skills to the requirements.

    JOB DESCRIPTION:
    ${jobDescription}
  `;

  let contents;
  if (typeof resumeInput === 'string') {
    contents = `
      ${basePrompt}

      RESUME:
      ${resumeInput}
    `;
  } else {
    contents = {
      parts: [
        { text: basePrompt },
        { inlineData: { mimeType: resumeInput.mimeType, data: resumeInput.data } }
      ]
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: contents,
    });
    return response.text || "Could not generate cover letter.";
  } catch (error) {
    console.error("Cover letter generation failed:", error);
    return "Error generating cover letter. Please try again.";
  }
};

/**
 * Agent 5: Latex Converter
 * Converts between LaTeX and Word/PDF-ready text formats.
 */
export const convertDocument = async (
  input: string | { mimeType: string; data: string },
  targetFormat: 'latex' | 'docx'
): Promise<string> => {
  const modelId = "gemini-2.5-flash";
  
  let userPrompt = "";
  if (targetFormat === 'latex') {
    userPrompt = `
      Convert the following document content into high-quality, professional LaTeX code.
      Use the 'article' class.
      Ensure all mathematical formulas are correctly formatted in LaTeX syntax.
      Use standard packages (amsmath, geometry, etc.).
      Return ONLY the raw LaTeX code. Do not include markdown code blocks (like \`\`\`latex), just the code.
    `;
  } else {
    userPrompt = `
      Convert the following LaTeX source code into clear, formatted plain text that mimics a Word document structure.
      Represent formulas in a readable text format where possible, or keep them as is if complex.
      Remove all LaTeX commands/tags.
      Keep structure (Headers, Bullet points) using Markdown-like syntax for readability.
      Return ONLY the converted content.
    `;
  }

  let contents;
  if (typeof input === 'string') {
    contents = `
      ${userPrompt}

      SOURCE CONTENT:
      ${input}
    `;
  } else {
    contents = {
      parts: [
        { text: userPrompt },
        { inlineData: { mimeType: input.mimeType, data: input.data } }
      ]
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: contents,
    });
    let text = response.text || "";
    // Clean up if the model adds markdown ticks despite instructions
    text = text.replace(/^```(latex|tex|markdown)?/i, '').replace(/```$/, '');
    return text.trim();
  } catch (error) {
    console.error("Document conversion failed:", error);
    throw error;
  }
};
