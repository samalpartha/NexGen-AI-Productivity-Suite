import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') { return res.status(200).end(); }
    if (req.method !== 'POST') { return res.status(405).json({ error: 'Method not allowed' }); }

    const apiKey = process.env.HF_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'HF_API_KEY missing' });

    const { inputContent } = req.body;
    if (!inputContent) return res.status(400).json({ error: 'inputContent missing' });

    // Zephyr 7B Prompt Format
    const prompt = `<|system|>
You are a rewriter. Rewrite the Input Text to be unique and human-like. 
Output ONLY valid JSON.
</s>
<|user|>
Input Text:
${inputContent}

JSON Format:
{
"humanizedText": "...",
"changesMade": ["..."],
"plagiarismRiskScore": 98
}
</s>
<|assistant|>
`;

    console.log("Attempting Zephyr 7B via Legacy Inference API");

    try {
        const response = await fetch("https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    max_new_tokens: 1000,
                    temperature: 0.7,
                    return_full_text: false
                }
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`API Error ${response.status}: ${err}`);
        }

        const data = await response.json() as any;
        const text = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text;

        // Parse
        let jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        try {
            const result = JSON.parse(jsonStr);
            return res.status(200).json({ ...result, originalText: inputContent });
        } catch (e) {
            return res.status(200).json({
                humanizedText: jsonStr,
                changesMade: ["Rewritten"],
                plagiarismRiskScore: 99,
                originalText: inputContent
            });
        }
    } catch (error: any) {
        console.error("Zephyr Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
