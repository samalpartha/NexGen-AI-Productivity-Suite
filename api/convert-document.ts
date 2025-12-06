import type { VercelRequest, VercelResponse } from '@vercel/node';
import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HF_API_KEY);

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
        const { input, targetFormat } = req.body;

        if (!input || !targetFormat) {
            return res.status(400).json({ error: 'Missing required fields: input and targetFormat' });
        }

        // Handle file input
        let inputText = '';
        if (typeof input === 'string') {
            inputText = input;
        } else if (input.data) {
            return res.status(400).json({
                error: 'Please paste content as text. File upload processing will be added soon.'
            });
        }

        let userPrompt = '';
        if (targetFormat === 'latex') {
            userPrompt = `Convert the following document content into high-quality, professional LaTeX code.
Use the 'article' class.
Ensure all mathematical formulas are correctly formatted in LaTeX syntax.
Use standard packages (amsmath, geometry, etc.).
Return ONLY the raw LaTeX code, no explanations.

SOURCE CONTENT:
${inputText}`;
        } else {
            userPrompt = `Convert the following LaTeX source code into clear, formatted plain text that mimics a Word document structure.
Represent formulas in a readable text format where possible.
Remove all LaTeX commands/tags.
Keep structure (Headers, Bullet points) using Markdown-like syntax for readability.
Return ONLY the converted content, no explanations.

LATEX SOURCE:
${inputText}`;
        }

        // Use Qwen 2.5 72B for document conversion
        const response = await hf.chatCompletion({
            model: "Qwen/Qwen2.5-72B-Instruct",
            messages: [
                { role: "user", content: userPrompt }
            ],
            max_tokens: 3000,
            temperature: 0.3,
        });

        let text = response.choices[0]?.message?.content || "";

        // Clean up if the model adds markdown ticks
        text = text.replace(/^```(latex|tex|markdown)?\n?/i, '').replace(/```\n?$/g, '');

        return res.status(200).json({ convertedText: text.trim() });

    } catch (error: any) {
        console.error("Document conversion failed:", error);
        return res.status(500).json({
            error: 'Document conversion failed',
            message: error.message || 'Unknown error'
        });
    }
}
