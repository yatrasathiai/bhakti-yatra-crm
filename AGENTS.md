# Yatra Saathi — Project Guide for AI Agents

> Read this file before changing this project. Then inspect the current source files: this guide records the intended product and the last known checkpoint, but the current project files are always the source of truth.

## 1. What we are building

This is an AI-powered conversational assistant for a **devotional trip organiser** (Bhakti Yatra). The team organises group pilgrimages and helps devotees visit spiritual shrines (Ayodhya, Kedarnath/Char Dham, Vaishno Devi, Tirupati, Kashi Varanasi, etc.) with affordable planning and respectful guidance.

The scope is the **focused, dedicated Chatbot experience** (`Yatra Saathi AI`). It is modular and designed so it can also be embedded directly into external websites via `<Chatbot />`.

### Main user outcome

A devotee/visitor can:
1. Chat naturally with **Yatra Saathi AI** in Hindi/Hinglish/English.
2. Ask about temple darshan timings, aarti schedules, VIP pass rules, routes, weather, and senior citizen facilities.
3. Browse popular pilgrimage packages (Ayodhya, Vaishno Devi, Char Dham, Tirupati).
4. Receive customized travel itineraries and budget planning.
5. Provide contact details (Name, WhatsApp/Phone) for follow-up by the yatra organisers.

## 2. Product and design direction

- **Clean Dedicated Chat UI**: Modern conversational interface (ChatGPT / Claude style), responsive on both mobile and desktop.
- **Spiritual Devotional Aesthetic**: Warm saffron, terracotta, sandalwood tones, clear typography, avatar with live green status pulse.
- **Tone**: Respectful, warm, devotional ("Namaste 🙏", "Jai Shri Ram", "Jai Mata Di", "Har Har Mahadev").
- **Zero Technical Friction**: Public users are never asked for API keys or configurations.

## 3. Current technical setup

- **Front end**: React 19, JSX, Vite 8.
- **Components**:
  - `src/components/Chatbot.jsx`: Standalone, modular AI chatbot component with message history, formatted text, dynamic suggestion chips, and in-chat package cards.
  - `src/components/Chatbot.css`: Scoped modern styles for the chatbot.
  - `src/services/aiService.js`: Multi-model AI service connecting to Google Gemini API with automatic cascade (`gemini-3.8-flash` ➔ `gemini-3.5-flash` ➔ `gemini-3.1-flash-lite` ➔ `gemini-2.5-flash`) plus an offline knowledge fallback.
  - `src/App.jsx`: Renders the focused full-screen Chatbot container.
  - `src/styles.css`: Base layout, typography, and viewport reset.
- **Environment**:
  - `.env`: Holds `VITE_GEMINI_API_KEY` securely on the dev environment.
- **Git**: Git repository initialized with version history.

### Local Node Setup

Portable Node runtime is at `.node/node-v26.13.1-win-x64/`.
To run dev server:
```powershell
$env:PATH = ".\.node\node-v26.13.1-win-x64;" + $env:PATH
npm run dev -- --port 5173
```

To build:
```powershell
$env:PATH = ".\.node\node-v26.13.1-win-x64;" + $env:PATH
npm run build
```

## 4. Current checkpoint & status

- **Status**: Active, fully operational AI Chatbot running at `http://localhost:5173/`.
- **AI Model**: Live Google Gemini 3.8 / 3.x Flash integration active.
- **Git**: Clean commit history on `master`.
