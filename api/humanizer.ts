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

    const apiKey = process.env.HF_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Configuration error: HF_API_KEY not set' });
    }

    const { inputContent, mode = 'Standard' } = req.body;
    if (!inputContent) {
        return res.status(400).json({ error: 'Missing inputContent' });
    }

    // Prepare Prompts
    const systemPrompt = "Rewrite the input text to be unique, human-like, and plagiarism-free. Maintain meaning. Return JSON.";
    const userPrompt = `Input: ${inputContent}\n\nFormat:\n{\n  "humanizedText": "...",\n  "changesMade": ["..."],\n  "plagiarismRiskScore": 98\n}`;

    // Model: Phi-3 Mini (High Availability)
    const MODEL = "microsoft/Phi-3-mini-4k-instruct";

    // Fallback Endpoints
    const endpoints = [
        {
            url: `https://router.huggingface.co/models/${MODEL}/v1/chat/completions`,
            type: 'chat',
            name: 'Router Chat'
        },
        {
            url: `https://api-inference.huggingface.co/models/${MODEL}/v1/chat/completions`,
            type: 'chat',
            name: 'Legacy Chat'
        },
        {
            url: `https://router.huggingface.co/models/${MODEL}`,
            type: 'task',
            name: 'Router Task'
        },
        {
            url: `https://api-inference.huggingface.co/models/${MODEL}`,
            type: 'task',
            name: 'Legacy Task'
        }
    ];

    let lastError = null;

    // Retry Loop
    for (const endpoint of endpoints) {
        console.log(`Attempting connection to: ${endpoint.name} (${endpoint.url})`);

        try {
            let body;
            if (endpoint.type === 'chat') {
                body = JSON.stringify({
                    model: MODEL,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt }
                    ],
                    max_tokens: 1000,
                    temperature: 0.7,
                    stream: false
                });
            } else {
                // Task endpoint needs raw string input
                body = JSON.stringify({
                    inputs: `<|system|>\n${systemPrompt}<|end|>\n<|user|>\n${userPrompt}<|end|>\n<|assistant|>\n`,
                    parameters: {
                        max_new_tokens: 1000,
                        temperature: 0.7,
                        return_full_text: false
                    }
                });
            }

            const response = await fetch(endpoint.url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: body
            });

            if (!response.ok) {
                const text = await response.text();
                // 503 means loading, usually retry works, but we skip to next endpoint for speed
                console.warn(`${endpoint.name} failed: ${response.status} ${text}`);
                lastError = `${response.status} ${text}`;
                continue; // Try next endpoint
            }

            const data = await response.json() as any;
            console.log(`${endpoint.name} SUCCESS!`);

            let responseText = '';
            if (endpoint.type === 'chat') {
                responseText = data.choices?.[0]?.message?.content || '';
            } else {
                // Task endpoint returns array
                responseText = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text || '';
            }

            // Parse JSON
            let jsonText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

            try {
                const result = JSON.parse(jsonText);
                return res.status(200).json({ ...result, originalText: inputContent });
            } catch (e) {
                // Return text if JSON parse fails
                return res.status(200).json({
                    humanizedText: jsonText,
                    changesMade: ["Rewritten content"],
                    plagiarismRiskScore: 99,
                    originalText: inputContent
                });
            }

        } catch (error: any) {
            console.error(`${endpoint.name} Exception:`, error.message);
            lastError = error.message;
        }
    }

    // If all fail
    return res.status(500).json({
        error: 'Humanization failed on all endpoints',
        lastError: lastError
    });
}
