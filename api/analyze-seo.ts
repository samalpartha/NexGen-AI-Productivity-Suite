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
        const { contentOrUrl, targetKeyword, isUrl } = req.body;

        if (!contentOrUrl || !targetKeyword) {
            return res.status(400).json({ error: 'Missing required fields: contentOrUrl and targetKeyword' });
        }

        let prompt = '';

        if (isUrl) {
            prompt = `Analyze the SEO performance of this website URL: ${contentOrUrl} for the target keyword: "${targetKeyword}".

Note: As an AI, I cannot directly access URLs. Please provide the page content as text for analysis.

For now, provide general SEO recommendations for optimizing content for the keyword "${targetKeyword}".`;
        } else {
            prompt = `You are an SEO expert. Analyze the following content for SEO optimization regarding the target keyword: "${targetKeyword}".

CONTENT:
${contentOrUrl}

Provide your analysis in the following JSON format (respond ONLY with valid JSON):
{
  "seoScore": <number 0-100>,
  "readabilityScore": <number 0-100>,
  "metaDescription": "Suggested meta description or analysis",
  "keywordDensity": "Analysis of keyword usage",
  "loadingSpeedQualitative": "Performance assessment based on content structure",
  "improvementChecklist": ["improvement1", "improvement2", "improvement3"]
}`;
        }

        // Use Mixtral 8x7B for SEO analysis
        const response = await hf.chatCompletion({
            model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
            messages: [
                { role: "user", content: prompt }
            ],
            max_tokens: 2000,
            temperature: 0.5,
        });

        const responseText = response.choices[0]?.message?.content || '';

        // Extract JSON from response
        let jsonText = responseText.trim();
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/```\n?/g, '').replace(/```\n?$/g, '');
        }

        const result = JSON.parse(jsonText);
        return res.status(200).json(result);

    } catch (error: any) {
        console.error("SEO analysis failed:", error);
        return res.status(500).json({
            error: 'SEO analysis failed',
            message: error.message || 'Unknown error'
        });
    }
}
