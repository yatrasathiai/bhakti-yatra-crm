# Yatra Saathi — Project Guide for AI Agents

> Read this file before changing this project. Then inspect the current source files: this guide records the intended product and the last known checkpoint, but the current project files are always the source of truth.

## 1. What we are building

This is an early prototype for a **devotional trip organiser**, not a general travel marketplace. The team organises group pilgrimages and wants to help more devotees visit spiritual places at an affordable cost. The product should make planning and enquiries simple, especially on a phone and for people who are not very comfortable with apps.

The current scope is the **website chatbot experience**. The user's friend has a separate website project; do not assume this folder contains it or rebuild that site without being asked. Keep this project focused on a useful, welcoming yatra assistant that can eventually be embedded in or connected to the main website.

### Main user outcome

A devotee should be able to:

1. Tell the assistant which pilgrimage destination they want, or browse available trips.
2. See organiser-confirmed dates, duration, departure city, inclusions and price when that information is available.
3. Ask for a custom trip if no listed package fits.
4. Share the preferred travel date and group size.
5. Request a follow-up from the trip organiser.

The current prototype only approximates this flow. It is **not** a live booking system: it does not reserve seats, take payments, check live availability, send a WhatsApp message, or notify the organiser.

## 2. Product and design direction

- Build for mobile first; many visitors will arrive on a phone.
- Make the interface easy to read, calm, warm, respectful and trustworthy. Avoid a loud sales or generic corporate-travel look.
- The current temporary name is **Yatra Saathi**. Confirm the real business/brand name with the user before treating it as final.
- Use simple Hindi/Hinglish wording, with English where useful. Do not make important steps depend on English fluency.
- Aim for a refined devotional travel aesthetic: warm ivory, earthy terracotta/saffron accents, forest green, generous spacing, clear type and subtle spiritual/travel motifs.
- Keep layouts fluid at narrow phone widths, with no horizontal page overflow. Make buttons comfortably tappable and forms keyboard accessible.
- Respect reduced-motion preferences, use semantic HTML, visible focus states, sufficient color contrast and descriptive labels.
- Be honest about trust, accessibility, safety, prices and service promises. Do not invent reviews, customer counts, guarantees, verified status or real-time information.

## 3. Current technical setup

- Front end: React, JSX and Vite.
- Project uses JavaScript modules (`"type": "module"`).
- Main files: `index.html`, `src/main.jsx`, `src/App.jsx`, `src/styles.css` (currently missing; see the checkpoint below), `package.json`, and `package-lock.json`.
- No backend, production database, authentication, AI model connection, external messaging integration or payment integration is present yet.
- Current chat responses are scripted rules in `src/App.jsx`; do not describe the existing assistant as an AI-powered/live chatbot.
- There is no Git repository in this folder at the last inspection. `.node/` and `node_modules/` are local setup folders, not source code; do not commit or copy them into a deployment artifact.
- Dependencies are installed under `node_modules`. `package.json` uses `latest` version labels while `package-lock.json` captures the installed resolution. Avoid casually upgrading dependencies; make deliberate, compatible changes and keep the lockfile aligned.

### Local Node setup

The system did not expose `node` or `npm` on PATH. A local Node runtime was downloaded into `.node/node-v26.13.1-win-x64/` for this prototype. From the project directory in PowerShell, use it like this:

```powershell
$node = ".\.node\node-v26.13.1-win-x64\node.exe"
& $node .\node_modules\npm\bin\npm-cli.js run dev -- --host 127.0.0.1
```

The local preview URL is normally `http://127.0.0.1:5173/` while the Vite process is running. For a production build, use:

```powershell
$node = ".\.node\node-v26.13.1-win-x64\node.exe"
& $node .\node_modules\npm\bin\npm-cli.js run build
```

Do not assume that a previously started server is still running. Check its output or open the local URL. Do not install global tools unless needed and explicitly explained.

## 4. Important current checkpoint — repair before feature work

The last redesign attempt was interrupted. At the latest inspection:

- `src/App.jsx` contains a newer landing page and chatbot UI with an inline SVG illustration, package cards and a scripted enquiry flow.
- `src/main.jsx` imports `./styles.css`.
- **`src/styles.css` does not exist right now.** This prevents Vite from loading the app correctly. Restore/create the stylesheet first, matching the current class names in `src/App.jsx`, then inspect the result at desktop and phone widths before continuing.
- The current `src/App.jsx` uses sample destinations and prices, collects a phone number, and saves enquiry data to browser `localStorage` under `yatra-demo-enquiries`. This is only local demo storage; it does not reach the organiser.
- Previous attempts had a plainer UI. Do not assume those old styles are still in the project; recreate the styles for the current JSX rather than relying on deleted files.

Keep this checkpoint accurate. After repairing it, update this section so the next agent does not waste time looking for a missing file.

## 5. Demo data and customer data rules

The following values currently appear in the prototype and are **invented sample data**, not organiser-confirmed offers:

| Destination | Example duration | Example starting fare | Example departure |
| --- | --- | --- | --- |
| Ayodhya | 2 days / 1 night | ₹3,999 | Delhi |
| Vaishno Devi | 4 days / 3 nights | ₹8,499 | Delhi |
| Char Dham | 10 days / 9 nights | ₹24,999 | Haridwar |
| Tirupati | 3 days / 2 nights | ₹9,999 | Chennai |

- Keep these prominently labelled as demo/sample data until the organiser supplies verified package details. Never show them as bookable live prices.
- The current flow also mentions stay and transport planning; confirm exact inclusions, departure points, dates, cancellation terms and accessibility arrangements before presenting them as confirmed facts.
- Do not add live customer enquiries, API keys, passwords or other secrets to source files or this guide.
- Phone numbers and travel preferences are personal information. The present browser `localStorage` behaviour is for a local prototype only. Before collecting real customer enquiries, add clear notice/consent, validate fields, minimise stored data, and use an appropriately secured backend with access controls and a retention/deletion plan. Never claim a local enquiry has been sent to staff.
- Keep sample enquiries out of logs, public screenshots and shared test artifacts.

## 6. Suggested roadmap

Work in small, reviewable steps and keep the user involved in product decisions.

### Phase A — make the current prototype presentable

1. Recreate `src/styles.css` so it matches the existing React component structure.
2. Make the page responsive, polished and accessible; inspect desktop and narrow mobile layouts.
3. Fix chatbot navigation and empty/error states. In particular, make the “custom yatra” action ask for a destination rather than treating the button label as the destination.
4. Keep all demo prices and package information visibly marked as sample data.
5. Give the user a clear way to restart or change a destination; validate date, traveller count and phone input.

### Phase B — organiser-approved content

Get the actual brand name, package list, real price basis, inclusions/exclusions, departure locations, future departure dates, child/senior policies, accessibility options, cancellation/refund policy and contact/handoff preferences from the organiser. Store this information as structured data rather than scattering it through UI components.

### Phase C — real enquiry handling

Agree the backend/database and hosting approach before implementing production storage. Add an enquiry API, server-side validation, privacy notice/consent, admin access and a staff handoff. Make the UI distinguish “saved on this device”, “received by our team” and “booking confirmed”. Those states are not interchangeable.

### Phase D — integrations and booking

Only after requirements and credentials/ownership are clear, consider WhatsApp Business messaging, AI-generated answers grounded in approved package data, booking/seat management, payments, analytics and deployment. Keep payment processing and confirmation server-side; do not store card data in this application.

## 7. Working agreement for AI agents and tools

- Start by reading this guide and inspecting the relevant source files. Check current file existence and app state; do not trust stale chat context.
- Before implementing, state the small outcome you are changing. Keep edits focused and preserve unrelated user work.
- One agent should own integration for a given change. If multiple agents/tools are used, split independent read-only research or separate files, avoid simultaneous edits to the same files, then have one agent reconcile and review the result.
- Do not replace large files or redesign the whole project for a small request. Avoid destructive cleanup, broad deletes and dependency upgrades without a clear need.
- Never invent organiser facts, testimonials, prices, departure seats or integrations. Ask the user when a missing business decision affects what customers will be told; otherwise use clearly labelled placeholders.
- Keep secrets in local environment configuration, never in frontend source. Anything shipped in browser code is public to visitors.
- Do not send customer messages or submit external forms without the user's explicit instruction.
- When asked to implement, finish the requested change and report what changed, what still needs business input, and what was/was not verified. Do not claim a feature works until it has actually been run in the current environment.
- Update this guide when the product scope, stack, data model, integrations or project checkpoint materially changes.

## 8. Decisions still needed from the organiser

These are open requirements, not facts agents should guess:

- Official company/product name, logo and preferred Hindi/English balance.
- Confirmed destinations, trip dates, prices, departure cities, inclusions and exclusions.
- Whether users should only enquire or eventually book and pay online.
- Where enquiries should go and who may access them (admin panel, CRM, phone/WhatsApp, email, etc.).
- Backend, database, hosting and budget choices for production.
- Senior citizen, medical assistance, accessibility, child and cancellation policies.
- Whether/which AI provider should answer free-form questions, and what approved source content it may use.

## 9. Current status summary

**Prototype stage.** React/Vite scaffolding, local Node runtime and a scripted chatbot UI are present. Sample travel details are unverified. The current stylesheet is missing, so the immediate next engineering task is to restore the CSS and verify that the app loads and responds at mobile and desktop sizes. There is no production backend or live customer integration.
