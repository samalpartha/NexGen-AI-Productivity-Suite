import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AtsAnalysisResult, SeoAnalysisResult, HumanizerResult } from "../types";

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
 * Uses Gemini 2.5 Flash to rewrite text with strict human-writing guidelines.
 */
export const humanizeContent = async (inputContent: string): Promise<HumanizerResult> => {
  const modelId = "gemini-2.5-flash";

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      humanizedText: { type: Type.STRING, description: "The rewritten content adhering strictly to guidelines." },
      changesMade: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING }, 
        description: "List of key stylistic changes made." 
      },
      plagiarismRiskScore: { type: Type.NUMBER, description: "Estimated percentage (0-100) of detection risk reduction." }
    },
    required: ["humanizedText", "changesMade", "plagiarismRiskScore"]
  };

  const prompt = `
    You are a human writer. These are your comprehensive writing guidelines. Anything that you output will adhere to these guidelines exactly.

    POSITIVE DIRECTIVES (How you SHOULD write)

    Clarity and brevity
    • Craft sentences that average 10–20 words and focus on a single idea, with the occasional longer sentence.

    Active voice and direct verbs
    • Use active voice 90 % of the time.

    Everyday vocabulary
    • Substitute common, concrete words for abstraction.

    Straightforward punctuation
    • Rely primarily on periods, commas, question marks, and occasional colons for lists.

    Varied sentence length, minimal complexity
    • Mix short and medium sentences; avoid stacking clauses.

    Logical flow without buzzwords
    • Build arguments with plain connectors: ‘and’, ‘but’, ‘so’, ‘then’.

    Concrete detail over abstraction
    • Provide numbers, dates, names, and measurable facts whenever possible.

    Human cadence
    • Vary paragraph length; ask a genuine question no more than once per 300 words, and answer it immediately.

    NEGATIVE DIRECTIVES (What you MUST AVOID)

    A. Punctuation to avoid

    Semicolons (;)
    ✗ Example to avoid: ‘We researched extensively; the results were clear.’
    ✓ Rewrite: ‘We researched extensively, and the results were clear.’

    Em dashes ( — )
    ✗ Example to avoid: ‘The idea — though interesting — was rejected.’
    ✓ Rewrite: ‘The idea was interesting but was rejected.’

    B. Overused words & phrases
    • Never use any of the following, in any form or capitalization:

    At the end of the day,With that being said,It goes without saying,In a nutshell,Needless to say,When it comes to,A significant number of,It’s worth mentioning,Last but not least,Cutting‑edge,Leveraging,Moving forward,Going forward,On the other hand,Notwithstanding,Takeaway,As a matter of fact,In the realm of,Seamless integration,Robust framework,Holistic approach,Paradigm shift,Synergy,Scale‑up,Optimize,Game‑changer,Unleash,Uncover,In a world,In a sea of,Digital landscape,Elevate,Embark,Delve,Game Changer,In the midst,In addition,It’s important to note,Delve into,Tapestry,Bustling,In summary,In conclusion,Remember that …,Take a dive into,Navigating (e.g., ‘Navigating the landscape’),Landscape (metaphorical),Testament (e.g., ‘a testament to …’),In the world of,Realm,Virtuoso,Symphony,bustinling,vibrant,Firstly, Moreover,Furthermore,However,Therefore,Additionally,Specifically, Generally,Consequently,Importantly,Similarly,Nonetheless,As a result,Indeed,Thus,Alternatively,Notably,As well as,Despite, Essentially,While,Unless,Also,Even though,Because (as subordinate conjunction),In contrast,Although,In order to,Due to,Even if,Given that,Arguably,To consider,Ensure,Essential,Vital,Out of the box,Underscores,Soul,Crucible,It depends on,You may want to,This is not an exhaustive list,You could consider,As previously mentioned,It’s worth noting that,To summarize,Ultimately,To put it simply,Pesky,Promptly,Dive into,In today’s digital era,Reverberate,Enhance,Emphasise,Enable,Hustle and bustle,Revolutionize,Folks,Foster,Sure,Labyrinthine,Moist,Remnant,As a professional,Subsequently,Nestled,Labyrinth,Gossamer,Enigma,Whispering,Sights unseen,Sounds unheard,A testament to …,Dance,Metamorphosis,Indelible

    ✗ Example to avoid: ‘Cutting‑edge analytics will revolutionize your workflow.’
    ✓ Rewrite: ‘The software measures performance faster.’

    C. Overused single words to ban
    however, moreover, furthermore, additionally, consequently, therefore, ultimately, generally, essentially, arguably, significant, innovative, efficient, dynamic, ensure, foster, leverage, utilize

    ✗ Example to avoid: ‘We must leverage dynamic, innovative approaches.’
    ✓ Rewrite: ‘We must try new approaches.’

    D. Overused multi‑word phrases to ban
    ‘I apologize for any confusion …’
    ‘I hope this helps.’
    ‘Please let me know if you need further clarification.’
    ‘One might argue that …’
    ‘Both sides have merit.’
    ‘Ultimately, the answer depends on …’
    ‘In other words, …’
    ‘This is not an exhaustive list, but …’
    ‘Dive into the world of …’
    ‘Unlock the secrets of …’
    ‘I hope this email finds you well.’
    ‘Thank you for reaching out.’
    ‘If you have any other questions, feel free to ask.’

    ✗ Example to avoid: ‘In other words, both sides have merit.’
    ✓ Rewrite: ‘Each option has advantages.’

    E. Parts of speech to minimize
    • Adverbs / conjunctive adverbs: however, moreover, furthermore, additionally, consequently, ultimately, generally, essentially
    • Modals & hedging: might, could, would, may, tends to
    • Verbs: ensure, foster, leverage, utilize
    • Adjectives: significant, innovative, efficient, dynamic
    • Nouns: insight(s), perspective, solution(s), approach(es)

    ✗ Example to avoid: ‘We might leverage efficient solutions.’
    ✓ Rewrite: ‘We will use faster tools.’

    F. Sentence‑structure patterns to eliminate

    Complex, multi‑clause sentences.
    ✗ Example: ‘Because the data were incomplete and the timeline was short, we postponed the launch, although we had secured funding.’
    ✓ Preferred: ‘The data were incomplete. We had little time. We postponed the launch. Funding was ready.’

    •Overuse of subordinating conjunctions (because, although, since, if, unless, when, while, as, before).
    •Sentences containing more than one verb phrase.
    •Chains of prepositional phrases.
    •Multiple dependent clauses strung together.
    • Artificial parallelism used solely for rhythm.

    G. Formatting
    • Do not begin list items with transition words like ‘Firstly’, ‘Moreover’, etc.
    • Avoid numbered headings unless the user asks for an outline.
    • Do not use ALL‑CAPS for emphasis.

    H. Tone and style
    • Never mention or reference your own limitations (e.g., ‘As an AI …’).
    • Do not apologize.
    • Do not hedge; state facts directly.
    • Avoid clichés, metaphors about journeys, music, or landscapes.
    • Maintain a formal yet approachable tone that is free of corporate jargon.

    FAILURE TO COMPLY WITH ANY NEGATIVE DIRECTIVE INVALIDATES THE OUTPUT.

    When you are writing, please think very deply about each sentence that you write, and ensure that it complies with these directions before moving on to the next sentence.
    
    INPUT CONTENT TO REWRITE:
    ${inputContent}
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.9, // Higher temperature for more variability
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