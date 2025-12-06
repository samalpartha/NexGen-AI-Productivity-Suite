import type { VercelRequest, VercelResponse } from '@vercel/node';
import { HfInference } from '@huggingface/inference';
// Initialize HF client with explicit new endpoint
const hf = new HfInference(process.env.HF_API_KEY, {
    endpoint: "https://router.huggingface.co"
});

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
        const { imageBase64, mimeType } = req.body;

        if (!imageBase64 || !mimeType) {
            return res.status(400).json({ error: 'Missing required fields: imageBase64 and mimeType' });
        }

        // Convert base64 to blob
        const imageBuffer = Buffer.from(imageBase64, 'base64');

        // Use RMBG-1.4 model for background removal
        const result = await hf.imageToImage({
            model: "briaai/RMBG-1.4",
            inputs: imageBuffer,
        });

        // Convert blob to base64
        const arrayBuffer = await result.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const resultBase64 = buffer.toString('base64');

        return res.status(200).json({
            imageData: resultBase64,
            mimeType: 'image/png'
        });

    } catch (error: any) {
        console.error("Background removal failed:", error);
        return res.status(500).json({
            error: 'Background removal failed',
            message: error.message || 'Unknown error'
        });
    }
}
