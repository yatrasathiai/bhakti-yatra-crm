# 🕉️ Yatra Saathi — AI Pilgrimage Tour Guide & Tourism CRM

> **An AI-powered devotional travel assistant & full-featured pilgrimage tour operations CRM platform built with React 19, Tailwind CSS, Google Gemini AI, and Supabase PostgreSQL.**

---

## 🌟 Key Highlights

* **🤖 Live Google Gemini AI Chatbot:** Multi-turn conversational yatra assistant providing temple darshan timings, aarti schedules, registration guides, and travel itineraries with warm devotional tone.
* **⚡ Smart AI Lead Capture:** Real-time extraction of devotee contact details, preferred destinations, group size, and travel dates directly from chat messages.
* **📊 Executive CRM Dashboard:** Live business metrics, monthly booking goals, conversion funnel analytics, and destination popularity distribution.
* **📋 Leads Management System:** Comprehensive leads table with filters, search, inline status updates, follow-up notes, 1-click WhatsApp redirect, and CSV data export.
* **📌 Visual Kanban Pipeline:** Lead stage tracking across *New Inquiry*, *Contacted*, *Itinerary Shared*, *Confirmed*, and *Completed*.
* **⛩️ Packages & Yatra Catalog:** Dynamic pilgrimage package manager with instant sync to chatbot suggestions.
* **🔒 PIN-Protected Admin & Cloud Sync:** 4-digit PIN access lock, customizable Agency branding, AI prompt controls, and dual-sync architecture (Local Cache + Supabase PostgreSQL).
* **📱 100% Responsive Design:** Tailored experience across desktop, tablet, and mobile with one-thumb bottom navigation and slide-in drawer.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 19, Vite 8, Lucide React Icons |
| **Styling & Design** | Tailwind CSS 4, Custom Devotional Gradient Palette |
| **Artificial Intelligence** | Google Gemini API (`gemini-2.5-flash`) |
| **Data & Cloud Storage** | LocalStorage Cache + Supabase PostgreSQL Cloud |
| **Integrations** | WhatsApp Direct Link, Model Context Protocol (MCP) |

---

## 🚀 Getting Started

### 1. Prerequisites
* Node.js (v18 or higher)
* Git

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/yatrasathiai/bhakti-yatra-crm.git
cd bhakti-yatra-crm

# Install dependencies
npm install
```

### 3. Environment Setup
Create a `.env` file in the project root:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.
* **Public Chatbot:** `/`
* **Admin CRM Dashboard:** `/admin` *(Default PIN: `1234`)*

---

## 📜 License
This project is licensed under the MIT License.
