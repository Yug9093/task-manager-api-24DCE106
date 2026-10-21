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
    // Models prioritized by speed and stability for Google Gemini API
    const candidateModels = [
      'gemini-3.5-flash-lite',
      'gemini-3.5-flash',
      'gemini-3.8-flash',
      'gemini-flash-latest'
    ];

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

    let generatedText = '';
    let lastError = null;
    let successfulModel = '';

    for (const model of candidateModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(geminiPayload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const candidate = data.candidates?.[0];
          const part = candidate?.content?.parts?.[0];
          generatedText = part?.text?.trim() || '';
          successfulModel = model;
          break;
        } else {
          const errData = await response.json().catch(() => ({}));
          lastError = errData.error?.message || `Status ${response.status}`;
          // If the API key is invalid (HTTP 400), don't retry other models
          if (response.status === 400 && lastError.toLowerCase().includes('key')) {
            break;
          }
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    if (generatedText) {
      return res.status(200).json({
        description: generatedText,
        fallback: false,
        model: successfulModel
      });
    }

    // Graceful fallback if models fail
    return res.status(200).json({
      description: '',
      fallback: true,
      error: lastError,
      message: 'AI service unavailable or API key invalid. You can enter a description manually.'
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
