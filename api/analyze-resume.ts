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
        const { resumeInput, jobDescription } = req.body;

        if (!resumeInput || !jobDescription) {
            return res.status(400).json({ error: 'Missing required fields: resumeInput and jobDescription' });
        }

        // Extract resume text (handle both string and file input)
        let resumeText = '';
        if (typeof resumeInput === 'string') {
            resumeText = resumeInput;
        } else if (resumeInput.data) {
            // For file uploads, we'd need to decode base64 and extract text
            // For now, return error asking for text input
            return res.status(400).json({
                error: 'Please paste resume text directly. File upload processing will be added soon.'
            });
        }

        const prompt = `You are an expert ATS (Applicant Tracking System) algorithm. Analyze the provided Resume against the Job Description and provide a detailed evaluation.

JOB DESCRIPTION:
${jobDescription}

RESUME:
${resumeText}

Provide your analysis in the following JSON format (respond ONLY with valid JSON, no other text):
{
  "matchScore": <number 0-100>,
  "missingKeywords": ["keyword1", "keyword2"],
  "formattingIssues": ["issue1", "issue2"],
  "suggestions": ["suggestion1", "suggestion2"],
  "summary": "Brief executive summary of the analysis"
}`;

        // Use Qwen 2.5 72B for structured output
        const response = await hf.chatCompletion({
            model: "Qwen/Qwen2.5-72B-Instruct",
            messages: [
                { role: "user", content: prompt }
            ],
            max_tokens: 2000,
            temperature: 0.3,
        });

        const responseText = response.choices[0]?.message?.content || '';

        // Extract JSON from response (handle markdown code blocks)
        let jsonText = responseText.trim();
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/```\n?/g, '').replace(/```\n?$/g, '');
        }

        const result = JSON.parse(jsonText);
        return res.status(200).json(result);

    } catch (error: any) {
        console.error("Resume analysis failed:", error);
        return res.status(500).json({
            error: 'Analysis failed',
            message: error.message || 'Unknown error'
        });
    }
}
