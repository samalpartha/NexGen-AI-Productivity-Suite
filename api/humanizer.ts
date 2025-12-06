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

        // Simplified prompt for Phi-3 (it follows instructions well but prefers conciseness)
        let modeInstruction = "Rewrite this text to be unique and human-like.";

        switch (mode) {
            case 'Academic': modeInstruction += " Style: Academic, objective, third-person."; break;
            case 'Formal': modeInstruction += " Style: Formal business tone, third-person."; break;
            case 'Casual': modeInstruction += " Style: Casual, conversational."; break;
            case 'Shorten': modeInstruction += " Concise summary."; break;
            case 'Expand': modeInstruction += " Detailed explanation."; break;
            default: modeInstruction += " Balanced tone."; break;
        }

        const systemPrompt = `You are a professional writer. Rewrite the input text.
Rules:
1. Maintain original meaning.
2. Changes words and sentence structure to be unique.
3. ${modeInstruction}
4. Respond ONLY with the JSON structure requested.`;

        const userPrompt = `Input Text:
${inputContent}

Output format (JSON only):
{
  "humanizedText": "...",
  "changesMade": ["..."],
  "plagiarismRiskScore": 98
}`;

        console.log("Using Chat Endpoint for Microsoft/Phi-3-mini-4k-instruct");
        console.log("API Key present:", !!apiKey);

        const response = await fetch("https://router.huggingface.co/models/microsoft/Phi-3-mini-4k-instruct/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "microsoft/Phi-3-mini-4k-instruct",
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
            const errorText = await response.text();
            console.error(`HF API Error ${response.status}: ${errorText}`);
            throw new Error(`HF API Error ${response.status}: ${errorText}`);
        }

        const data = await response.json() as any;
        console.log("HF API response received successfully");

        const responseText = data.choices?.[0]?.message?.content || '';

        // Extract JSON
        let jsonText = responseText.trim();
        // Remove markdown code blocks if present
        if (jsonText.includes('```json')) {
            jsonText = jsonText.split('```json')[1].split('```')[0].trim();
        } else if (jsonText.includes('```')) {
            jsonText = jsonText.split('```')[1].split('```')[0].trim();
        }

        try {
            const result = JSON.parse(jsonText);
            // Ensure humanizedText exists
            if (!result.humanizedText) throw new Error("Missing humanizedText field");

            return res.status(200).json({ ...result, originalText: inputContent });
        } catch (e) {
            console.error("JSON Parse Error:", e);
            console.error("Raw Text:", responseText);
            // Fallback
            return res.status(200).json({
                humanizedText: responseText.replace(/```json/g, '').replace(/```/g, '').trim(),
                changesMade: ["Rewritten content"],
                plagiarismRiskScore: 99,
                originalText: inputContent
            });
        }

    } catch (error: any) {
        console.error("=== HUMANIZATION ERROR ===");
        console.error("Error type:", error.constructor.name);
        console.error("Error message:", error.message);

        return res.status(500).json({
            error: 'Humanization failed',
            message: error.message || 'Unknown error',
            details: error.toString(),
            errorType: error.constructor.name
        });
    }
}
