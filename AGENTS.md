# Yatra Saathi — Project Guide for AI Agents

> Read this file before changing this project. Then inspect the current source files: this guide records the intended product and the last known checkpoint, but the current project files are always the source of truth.

## 1. What we are building

**Yatra Saathi** is an AI-powered conversational platform and lightweight CRM for a devotional trip organiser (Bhakti Yatra). 

It connects two core workflows:
1. **Devotee / Visitor Interface (`<Chatbot />`)**: A human-like AI devotional travel guide that answers queries on Bharat's sacred shrines (Ayodhya, Kedarnath, Vaishno Devi, Tirupati, Kashi, etc.), provides packages, and captures enquiries.
2. **Organiser CRM Dashboard (`<CrmDashboard />`)**: A dedicated admin panel where the yatra team tracks incoming leads, manages status pipelines (New ➔ Contacted ➔ Booked ➔ Cancelled), writes internal notes, and initiates 1-click WhatsApp follow-ups with devotees.

## 2. Product and Architecture

- **Chatbot View (`src/components/Chatbot.jsx`)**:
  - Full-screen focused chat UI with quick chips, responsive mobile layout, and devotional aesthetic.
  - Multi-model Gemini AI engine with automatic fallback (`gemini-3.8-flash` ➔ `gemini-3.5-flash` ➔ `gemini-3.1-flash-lite`).
  - Automatic lead extraction using Gemini: extracts `{ name, phone, destination, travellers, preferred_date }` from natural conversations.
  - Includes a topbar badge/button `📊 CRM (count)` to switch to the CRM dashboard.
- **Admin PIN Protection (`src/App.jsx`)**:
  - Default Admin PIN: `1234`
  - Session-authenticated in `sessionStorage`.
- **CRM Dashboard (`src/components/CrmDashboard.jsx` & `CrmDashboard.css`)**:
  - Metric overview cards: Total Leads, New (Pending), Contacted, Booked, and Top Destination.
  - Real-time search by name, phone, or destination.
  - Status filter dropdown (`all`, `new`, `contacted`, `booked`, `cancelled`).
  - Interactive lead table with direct status updates, inline editable internal notes, and delete action.
  - 1-click WhatsApp button (`https://wa.me/91...?text=...`) pre-filled with personalized Hindi greeting.
  - Auto-refreshes every 15 seconds.
- **Data Layer (`src/services/databaseService.js`)**:
  - Cloud-ready Supabase integration (`@supabase/supabase-js`) for persistent PostgreSQL storage.
  - Automatic zero-config fallback to `localStorage` when Supabase credentials are not provided.
  - Includes seed leads for immediate testing.

## 3. Tech Stack

- **Frontend**: React 19, JSX, Vite 8
- **AI Models**: Google Gemini 3.8 / 3.x Flash
- **Database**: Supabase + browser localStorage fallback
- **Messaging**: Direct WhatsApp deep-links (`wa.me`)

### Running Locally

```powershell
$env:PATH = ".\.node\node-v26.13.1-win-x64;" + $env:PATH
npm run dev -- --port 5173
```

To build:
```powershell
$env:PATH = ".\.node\node-v26.13.1-win-x64;" + $env:PATH
npm run build
```

## 4. Current Status

- **Chatbot & CRM**: 100% operational and running at `http://localhost:5173/`.
- **Admin PIN**: `1234`
- **Git**: Clean commit history on `master`.
