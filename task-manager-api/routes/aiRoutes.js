const express = require('express');
const router = express.Router();

/**
 * POST /api/ai/generate-description
 * Description: Generates a task description based on the provided task title using Google Gemini API.
 * Graceful Degradation: If API key is missing, invalid, rate-limited, or times out,
 *                       the endpoint safely returns status 200 with { fallback: true } so the app never crashes.
 */
router.post('/generate-description', async (req, res) => {
  const { title } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Task title is required to generate an AI description'
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // Gracefully handle missing or default placeholder API key
  if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.trim() === '') {
    return res.status(200).json({
      description: '',
      fallback: true,
      message: 'Gemini API key is not configured in .env. You can type notes manually.'
    });
  }

  try {
    // Call Gemini 1.5 Flash via REST endpoint
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey.trim())}`;
    
    // Set 8-second timeout using AbortController to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const geminiPayload = {
      contents: [
        {
          parts: [
            {
              text: `You are an AI assistant for a task management application. Write a concise, actionable, and helpful 1-2 sentence description for a task titled "${title.trim()}". Return only the description text without any markdown headings, bullet points, or quotes.`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 120
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(geminiPayload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn('Gemini API returned error response:', response.status, errorData);
      return res.status(200).json({
        description: '',
        fallback: true,
        error: errorData.error?.message || `Gemini API returned status ${response.status}`,
        message: 'AI service unavailable or API key invalid. You can enter a description manually.'
      });
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    return res.status(200).json({
      description: generatedText,
      fallback: false,
      model: 'gemini-1.5-flash'
    });
  } catch (err) {
    console.error('Gemini AI generation exception:', err.message);
    return res.status(200).json({
      description: '',
      fallback: true,
      error: err.message,
      message: 'AI generation timed out or failed. You can enter a description manually.'
    });
  }
});

module.exports = router;
