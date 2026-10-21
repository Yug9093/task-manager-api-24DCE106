# Practical 13: AI API Integration into a Web Application (Google Gemini API)

**Course Outcome / Program Outcome:** CO1, CO4 / PO3, PO5  
**Objective:** To integrate an AI-powered feature into the Task Management application using the Google Gemini API (via direct REST API / native fetch), auto-generating task descriptions from task titles, safeguarding API keys strictly within the backend `.env` configuration, handling failures and timeouts gracefully without crashing the core system, and rendering editable suggestions in the React user interface.

---

## 📌 1. Aim & Problem Statement

### Problem Statement:
- Add an AI-powered feature to the Task Management application using the **Google Gemini API**.
- The feature must serve a meaningful purpose: auto-generating a task description and action plan based on the task title entered by the user.
- The API key must be stored and used **only on the backend (`.env`)**, never exposed to the frontend.
- Handle API errors gracefully: if the AI call fails, times out, or receives an invalid key, the core application must continue to function normally (`res.status(200).json({ description: '', fallback: true })`).
- Display the AI-generated response meaningfully in the React UI as an **editable suggestion** that the student can accept or modify, never as raw JSON.
- Demonstrate and document both the normal path and the failure path (temporarily using an invalid API key).

---

## 🏗️ 2. Architecture & Data Flow

```text
=============================================================================
PRACTICAL 13: AI API INTEGRATION ARCHITECTURE (GOOGLE GEMINI API)
=============================================================================

[ React Frontend (Vite) ]
       │
       │ 1. User enters task title (e.g., "Prepare Final Year Presentation")
       │ 2. User clicks "✨ Generate description"
       ▼
 [ POST /api/ai/generate-description ] ──> (No API key exposed in request/headers)
       │
       ▼
[ Node.js / Express Backend ]
       │
       ├─► Reads process.env.GEMINI_API_KEY (Server-side only)
       ├─► Validates presence and format of title
       │
       ├─── [ Valid API Key ] ──────────────► [ Google Gemini 1.5 Flash API ]
       │                                            │
       │                                            ▼
       │                                      REST Response (200 OK)
       │                                            │
       │   ◄─── { description: "...", fallback: false } ◄┘
       │
       └─── [ Invalid Key / Rate Limit / Timeout ]
           │
           ├─► Catches error gracefully (AbortSignal / try-catch)
           ├─► Prevents server crash / no uncaught exception
           ▼
   ◄─── HTTP 200 OK: { description: '', fallback: true, message: '...' }
       │
       ▼
[ React UI Presentation ]
       │
       ├─► If fallback: Displays friendly warning banner ("⚠️ Fallback mode...")
       │                Expands editable textarea for manual note entry
       │
       └─► If generated: Populates description textarea as an EDITABLE suggestion
                        Allows user to tweak, append, or accept
```

---

## 🛠️ 3. Step-by-Step Implementation

### Step 1: Direct Gemini REST API Integration
Implemented zero-dependency Google Gemini integration via native Node.js `fetch` and standard REST endpoints:
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
- **Model**: `gemini-1.5-flash`
- **Timeout**: 8,000 ms via `AbortSignal.timeout(8000)`

### Step 2: Backend Environment Configuration (`.env` & `.env.example`)
The API key is strictly maintained on the server inside [`task-manager-api/.env`](file:///c:/Users/yugpa/OneDrive/Documents/GitHub/task-manager-api-24DCE106/task-manager-api/.env), which is excluded from git version control via `.gitignore`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/taskDB
JWT_SECRET=mySuperSecretJwtKeyTaskFlow2026!
GEMINI_API_KEY=your_gemini_api_key_here
```

A template file [`task-manager-api/.env.example`](file:///c:/Users/yugpa/OneDrive/Documents/GitHub/task-manager-api-24DCE106/task-manager-api/.env.example) was created for development setup:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/taskDB
JWT_SECRET=your_jwt_secret_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### Step 3: Backend Route with Graceful Degradation (`routes/aiRoutes.js`)
Created [`task-manager-api/routes/aiRoutes.js`](file:///c:/Users/yugpa/OneDrive/Documents/GitHub/task-manager-api-24DCE106/task-manager-api/routes/aiRoutes.js) and mounted it at `POST /api/ai/generate-description` in [`task-manager-api/index.js`](file:///c:/Users/yugpa/OneDrive/Documents/GitHub/task-manager-api-24DCE106/task-manager-api/index.js):

```javascript
const express = require('express');
const router = express.Router();

router.post('/generate-description', async (req, res) => {
  const { title } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Task title is required to generate an AI description'
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // Handle missing or placeholder key gracefully
  if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.trim() === '') {
    return res.status(200).json({
      description: '',
      fallback: true,
      message: 'Gemini API key is not configured in .env. You can type notes manually.'
    });
  }

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey.trim())}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const geminiPayload = {
      contents: [{
        parts: [{
          text: `You are an AI assistant for a task management application. Write a concise, actionable, and helpful 1-2 sentence description for a task titled "${title.trim()}". Return only the description text without any markdown headings, bullet points, or quotes.`
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 120
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
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
    return res.status(200).json({
      description: '',
      fallback: true,
      error: err.message,
      message: 'AI generation timed out or failed. You can enter a description manually.'
    });
  }
});

module.exports = router;
```

### Step 4: Frontend API Client Method (`frontend/src/api.js`)
Added `generateAiDescription` to [`frontend/src/api.js`](file:///c:/Users/yugpa/OneDrive/Documents/GitHub/task-manager-api-24DCE106/frontend/src/api.js):

```javascript
export const generateAiDescription = async (title) => {
  try {
    const res = await fetch(`${BASE_URL}/api/ai/generate-description`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    return await res.json();
  } catch (err) {
    return {
      description: '',
      fallback: true,
      error: err.message,
      message: 'Network error connecting to AI service. You can write your description manually.',
    };
  }
};
```

### Step 5: Frontend Task Creation UI with Editable Suggestion & Fallback (`TaskForm.jsx`)
Updated [`frontend/src/components/TaskForm.jsx`](file:///c:/Users/yugpa/OneDrive/Documents/GitHub/task-manager-api-24DCE106/frontend/src/components/TaskForm.jsx):
- Features a **"✨ Generate description"** button beside the task title input.
- Displays a loading spinner and state (`Thinking...`) while the AI request is processing.
- When an AI suggestion is returned, it automatically opens the description box and places the generated text as an **editable textarea suggestion** so the student can accept, tweak, or extend it.
- When in fallback mode (or invalid API key), it displays a non-blocking alert badge: `⚠️ AI service unavailable (fallback mode). You can enter a description manually.` and allows manual input.

---

## 📊 4. Empirical Verification & Test Results

### Test Suite Results (`npm test` in `task-manager-api`):

```text
PASS tests/app.test.js
  Task Management API Tests (CI Pipeline)
    √ GET / returns 200 and welcome message (59 ms)
    √ GET /tasks returns 200 (69 ms)
    √ POST /api/ai/generate-description returns 400 when title is missing (26 ms)
    √ POST /api/ai/generate-description gracefully handles fallback without crashing (status 200) (11 ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        1.797 s
```

### Demonstration of the Failure Path (Step 6):
Executed failure verification with an invalid API key (`AIzaSyInvalidKeyTestingFailure123456789`):

```text
===============================================================
PRACTICAL 13: AI FAILURE PATH & STABILITY VERIFICATION
===============================================================

[TEST 1] Invoking POST /api/ai/generate-description with an INVALID API key...
Gemini API returned error response: 400 {
  error: {
    code: 400,
    message: 'API key not valid. Please pass a valid API key.',
    status: 'INVALID_ARGUMENT'
  }
}
HTTP Status: 200 (Expected: 200)
Execution Time: 630 ms
Response Payload: {
  "description": "",
  "fallback": true,
  "error": "API key not valid. Please pass a valid API key.",
  "message": "AI service unavailable or API key invalid. You can enter a description manually."
}

[TEST 2] Invoking POST /api/ai/generate-description with MISSING API key...
HTTP Status: 200 (Expected: 200)
Response Payload: {
  "description": "",
  "fallback": true,
  "message": "Gemini API key is not configured in .env. You can type notes manually."
}

[TEST 3] Verifying core API stability after AI failures (GET /tasks)...
Core GET /tasks Status: 200
Core GET /tasks Success: true

===============================================================
RESULT: AI errors handled gracefully. Core application 100% stable.
===============================================================
```

---

## 📸 5. Lab Journal Submission & Screenshot Guide

Capture the following screenshots to submit with your lab journal:

1. **Frontend Task Creation UI with AI Button**:
   - Navigate to `http://localhost:5173`.
   - Take a screenshot of the task creation form highlighting the **"✨ Generate description"** button next to the title input.
2. **AI Fallback State Demonstration**:
   - Enter a title: `Prepare Final Year Presentation Slides`.
   - Click **"✨ Generate description"**.
   - Capture a screenshot showing the amber fallback notice badge (`Gemini API key is not configured in .env. You can type notes manually.`) with the editable textarea open.
3. **Task Created Successfully**:
   - Type manual notes into the editable description field.
   - Click **"Add Task"**.
   - Capture a screenshot of the task list showing the newly added task with title and description rendered properly.
4. **Backend Test Suite Results**:
   - In terminal, run `npm test` inside `task-manager-api`.
   - Take a screenshot of the 4 green passing tests including the AI fallback and validation tests.
