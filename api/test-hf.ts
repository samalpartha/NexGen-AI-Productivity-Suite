import type { VercelRequest, VercelResponse } from '@vercel/node';
import { HfInference } from '@huggingface/inference';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const apiKey = process.env.HF_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error: 'HF_API_KEY not set',
                message: 'Environment variable HF_API_KEY is missing'
            });
        }

        // Test with a simple model
        const hf = new HfInference(apiKey);

        const response = await hf.chatCompletion({
            model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
            messages: [
                { role: "user", content: "Say hello in one word" }
            ],
            max_tokens: 10,
        });

        return res.status(200).json({
            success: true,
            message: 'HF API is working!',
            response: response.choices[0]?.message?.content,
            keyPrefix: apiKey.substring(0, 7) + '...'
        });

    } catch (error: any) {
        console.error("Test failed:", error);

        return res.status(500).json({
            error: 'Test failed',
            message: error.message,
            details: error.toString(),
            stack: error.stack
        });
    }
}
