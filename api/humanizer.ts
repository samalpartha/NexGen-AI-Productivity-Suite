import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const apiKey = process.env.HF_API_KEY;
        if (!apiKey) {
            return res.status(500).json({
                error: 'Configuration error',
                message: 'HF_API_KEY environment variable is not set'
            });
        }

        const { inputContent, mode = 'Standard' } = req.body;

        if (!inputContent) {
            return res.status(400).json({ error: 'Missing required field: inputContent' });
        }

        let modeInstruction = "Rewrite this text to be 100% unique, human-like, and plagiarism-free. ";
        let perspectiveDirective = "Use a generic, objective tone.";

        switch (mode) {
            case 'Academic':
                modeInstruction += "CONTEXT: Academic/Research. TONE: Scholarly, Objective, Nuanced. STRICTLY THIRD PERSON.";
                perspectiveDirective = "STRICTLY THIRD PERSON. Do not use 'I', 'We', or 'You'.";
                break;
            case 'Formal':
                modeInstruction += "CONTEXT: Professional Business. TONE: Formal, objective. STRICTLY THIRD PERSON.";
                perspectiveDirective = "Write strictly in the THIRD PERSON.";
                break;
            case 'Casual':
                modeInstruction += "CONTEXT: Casual Conversation. TONE: Chatty, relaxed.";
                perspectiveDirective = "Conversational tone.";
                break;
            case 'Shorten':
                modeInstruction += "CONTEXT: Concise Summary. Remove fluff while keeping core message.";
                break;
            case 'Expand':
                modeInstruction += "CONTEXT: Detailed Explanation. Add examples to increase length.";
                break;
            default:
                modeInstruction += "Balance clarity with human nuance.";
                break;
        }

        const prompt = `You are an expert writer. Your task is to rewrite the following text to make it unique, human-like, and bypass AI detection.

MODE: ${mode}
${modeInstruction}
${perspectiveDirective}

CRITICAL RULES:
1. Maintain the same paragraph structure and length
2. Vary sentence length dramatically (mix short and long sentences)
3. Use everyday vocabulary, avoid jargon
4. AVOID these AI-detection triggers: "However", "Therefore", "Moreover", "Furthermore", "In conclusion", "It is important to note"
5. Do NOT use contractions (use "do not" instead of "don't")
6. Keep the same meaning and key points

INPUT TEXT:
${inputContent}

Provide your response in the following JSON format (respond ONLY with valid JSON):
{
  "humanizedText": "The rewritten content here",
  "changesMade": ["change1", "change2", "change3"],
  "plagiarismRiskScore": <number 96-99>
}`;

        // Wrapped prompt for Mixtral Instruct
        const formattedPrompt = `[INST] ${prompt} [/INST]`;

        console.log("Using standard Task Endpoint logic for Mixtral");
        console.log("API Key present:", !!apiKey);

        const response = await fetch("https://router.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                inputs: formattedPrompt,
                parameters: {
                    max_new_tokens: 4000,
                    temperature: 1.0,
                    return_full_text: false
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HF API Error ${response.status}: ${errorText}`);
        }

        const data = await response.json() as any;
        console.log("HF API response received successfully");

        // Response from task endpoint is usually an array: [{ generated_text: "..." }]
        const responseText = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text || '';
        console.log("Response text length:", responseText?.length);

        // Extract JSON from response
        let jsonText = responseText.trim();
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/```\n?/g, '').replace(/```\n?$/g, '');
        }

        const result = JSON.parse(jsonText);
        return res.status(200).json({ ...result, originalText: inputContent });

    } catch (error: any) {
        console.error("=== HUMANIZATION ERROR ===");
        console.error("Error type:", error.constructor.name);
        console.error("Error message:", error.message);

        // Log the raw error object
        console.error("Raw error object:", JSON.stringify(error, null, 2));

        return res.status(500).json({
            error: 'Humanization failed',
            message: error.message || 'Unknown error',
            details: error.toString(),
            errorType: error.constructor.name
        });
    }
}
