/**
 * ============================================================================
 * YATRA SAATHI — SMART LEAD EXTRACTOR
 * AI se natural chat message se naam, phone, destination, travellers, date
 * automatically extract karta hai.
 * ============================================================================
 */

const EXTRACT_PROMPT = `Tum ek data extractor ho. Niche ek chat conversation di gayi hai ek yatra/pilgrimage chatbot aur visitor ke beech mein.

Tumhara kaam hai visitor ke messages se yeh fields extract karna (agar available hain):
- name: Visitor ka naam
- phone: Phone ya WhatsApp number (sirf digits, 10 digit Indian number)
- destination: Kahan yatra karna chahta hai (mandir/dham ka naam)
- travellers: Kitne log jayenge (number)
- preferred_date: Kab jaana chahte hain

RULES:
1. Sirf wahi fields return karo jo clearly mentioned hain. Missing fields ke liye empty string "" do.
2. Response SIRF ek valid JSON object hona chahiye, koi extra text nahi.
3. Phone number mein sirf digits rakho (no spaces, no +91).

Example output:
{"name":"Rohit Sharma","phone":"9876543210","destination":"Kedarnath","travellers":"4","preferred_date":"December"}`;

export async function extractLeadFromChat(messages) {
  const apiKey = (typeof import.meta !== "undefined" && import.meta.env?.VITE_GEMINI_API_KEY) || "AIzaSyC4RXhV2tv_Ukcd9w31qZxuOQgudzbG9GM";

  // Build conversation text from user messages
  const userTexts = messages
    .filter((m) => m.type === "user")
    .map((m) => m.text)
    .join("\n");

  if (!userTexts.trim()) return null;

  // Quick check: does the conversation even have phone-like or name-like data?
  const hasPhone = /\d{10}/.test(userTexts);
  const hasName = messages.some(
    (m) => m.type === "user" && /\b(mera naam|my name|naam hai|name is|naam)\b/i.test(m.text)
  );

  if (!hasPhone && !hasName) return null;

  const CANDIDATE_MODELS = ["gemini-2.5-flash", "gemini-3.8-flash", "gemini-3.5-flash"];

  for (const model of CANDIDATE_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: EXTRACT_PROMPT }] },
            contents: [{ role: "user", parts: [{ text: `Chat messages:\n${userTexts}` }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 200 },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        
        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          
          // Validate: at least name or phone should exist
          if (parsed.name || parsed.phone) {
            return {
              name: (parsed.name || "").trim(),
              phone: (parsed.phone || "").replace(/\D/g, "").slice(-10),
              destination: (parsed.destination || "").trim(),
              travellers: (parsed.travellers || "").trim(),
              preferred_date: (parsed.preferred_date || "").trim(),
            };
          }
        }
      }
    } catch (err) {
      console.warn(`Lead extraction with ${model} failed:`, err);
    }
  }

  // Manual regex fallback if AI is unavailable
  const phoneMatch = userTexts.match(/\b(\d{10})\b/);
  const nameMatch = userTexts.match(/(?:mera naam|my name|naam hai|name is)\s+([A-Za-z\u0900-\u097F\s]+)/i);

  if (phoneMatch || nameMatch) {
    return {
      name: nameMatch ? nameMatch[1].trim() : "",
      phone: phoneMatch ? phoneMatch[1] : "",
      destination: "",
      travellers: "",
      preferred_date: "",
    };
  }

  return null;
}

