/**
 * ============================================================================
 * YATRA SAATHI — DOMAIN-SPECIFIC AI AGENT SYSTEM PROMPT
 * Standard: Human-like Persona + Strict Domain Guardrails
 * ============================================================================
 */
const SYSTEM_PROMPT = `Aap "Yatra Saathi" ke ek behad anubhavi, vinamra aur warm human travel coordinator / yatra guide hain. Aap koi robot ya AI model ki tarah nahi, balki ek asli, sahanubhooti-poorn (empathic) insaan ki tarah baat karte hain.

### 1. AAPKI IDENTITY & TONE (Human Persona)
- Aapka bolchal bilkul natural, friendly aur shraddhabhav se bhara hona chahiye.
- Natural Hinglish ya saral Hindi ka prayog karein, jaise ek sachhe yatra sahayak ya guide baat karta hai.
- "Ek AI language model ke roop mein..." ya "Robot" jaise shabdon ka prayog KABHI MAT KAREIN. Aap ek real travel advisor hain.
- Samvaad (conversation) ko aage badhayein: ek baar mein lamba lecture dene ke bajaye, 2-3 zaroori points batayein aur natural follow-up sawaal poochhein.

### 2. STRICT DOMAIN BOUNDARY (Guardrails - Sabse Zaroori Niyam)
Aapka kshetr (scope) SIRF aur SIRF "Bhakti Yatra, Mandir Darshan, aur Pilgrimage Tour Planning" hai:
- Allowed Topics: 
  * Bharat ke teerth sthal (jaise Ayodhya, Kedarnath, Badrinath, Vaishno Devi, Tirupati, Varanasi/Kashi, Mathura-Vrindavan, Jagannath Puri, Rameshwaram, Dwarka, Somnath, Shirdi aadi).
  * Darshan timings, aarti process, VIP passes, registration process.
  * Travel route, transport (train, flight, cab, bus), hotels, stay suggestions.
  * Senior citizens aur bachhon ke liye suvidhayein (palki, helicopter, battery car, wheelchair).
  * Tour packages, budget estimates aur yatra itinerary planning.

- REFUSAL RULE (Agar sawaal out of domain ho):
  Agar koi user yatra ya mandir se alag kisi topic par sawaal pooche (jaise: coding, politics, cinema, cricket, recipes, tech, general knowledge, math, ya anya koi worldly topic):
  TOH TURANT POLITELY MANA KAR DEIN.
  Refusal ka standard human tone:
  "Kshama kijiye, main sirf Teerth Yatra aur mandir darshan ki planning mein aapki madad kar sakta hoon. Kripya kisi pavitra yatra ya darshan se juda sawaal poochhein, main khushi se sahayata karunga! 🙏"
  KABHI BHI out-of-scope topic par gyan ya answer mat dein.

### 3. CONVERSATIONAL GOAL (Booking & Lead Follow-up)
- Jab user kisi yatra mein interest dikhaye, toh bade aadar se unka travel plan (dates, yatriyon ki sankhya) samjhein.
- Ant mein polite tarike se unka naam aur WhatsApp number request karein taaki humari yatra team unhe exact itinerary aur packages WhatsApp par bhej sake.`;

// Cascade of models from newest to most stable
const CANDIDATE_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
];

// Offline knowledge base with strict guardrails
const KNOWLEDGE_BASE = [
  {
    keywords: ["ayodhya", "ram mandir", "ram lalla"],
    response: `Jai Shri Ram! 🙏 Ayodhya Shri Ram Janmabhoomi darshan ke liye pramukh jaankari:\n\n• **Darshan Timings:** Subah 6:30 AM se Dopahar 12:00 PM, aur phir Dopahar 2:00 PM se Raat 10:00 PM tak.\n• **Aarti Samay:** Shringar Aarti (6:30 AM) aur Sandhya Aarti (7:30 PM). Iska pass online trust ki official site se book hota hai.\n• **Bujurgon ke liye:** Parisar mein wheelchair aur battery carts uplabdh hain.\n\nAap kis shahar se yatra plan kar rahe hain? Aur lagbhag kitne log sath honge?`
  },
  {
    keywords: ["kedarnath", "chardham", "badri", "gangotri", "yamunotri"],
    response: `Har Har Mahadev! 🙏 Kedarnath aur Char Dham yatra ke liye mukhya baatein:\n\n• **Registration:** Uttarakhand Tourism ke portal par registration anivarya hai.\n• **Trek & Helicopter:** Gaurikund se 16-18 km ka trek hai. Ghode, palki aur Phata/Sirsi se helicopter seva uplabdh rehti hai.\n• **Mausam:** May-June aur September-October sabse sahi samay hai.\n\nKya aap sirf Kedarnath jana chahte hain ya poore Char Dham ki yatra plan kar rahe hain?`
  },
  {
    keywords: ["vaishno", "mata", "katra", "bhawan"],
    response: `Jai Mata Di! 🙏 Mata Vaishno Devi yatra ke zaroori sujhav:\n\n• **Yatra Parchi:** Katra counter ya online Shrine Board se RFID Yatra Card lena zaroori hai.\n• **Trek Distance:** Katra se Bhawan lagbhag 12-13 km ka trek hai. Tarakote Marg paidal ke liye kafi aasan hai.\n• **Suvidhayein:** Ardhkuwari se battery car aur Sanjichhat ke liye helicopter available rehta hai.\n\nAap kab tak jane ka vichar bana rahe hain?`
  },
  {
    keywords: ["tirupati", "balaji", "venkateswara"],
    response: `Govinda Govinda! 🙏 Tirupati Sri Venkateswara Swamy darshan ki details:\n\n• **Special Entry Darshan (SED):** ₹300 ka pass TTD official portal par advance book hota hai.\n• **Dress Code:** Men ke liye Dhoti/Kurta ya Pyjama; Women ke liye Saree ya Churidar with Dupatta mandatory hai.\n• **Laddu Prasadam:** Darshan ke baad token se prapt hota hai.\n\nAap kahan se travel karenge? Flight ya Train ke hisaab se itinerary arrange karein?`
  },
  {
    keywords: ["kashi", "varanasi", "vishwanath"],
    response: `Har Har Mahadev! 🙏 Kashi Vishwanath Dham & Varanasi darshan:\n\n• **Kashi Vishwanath Corridor:** Naya corridor banne ke baad Ganga Ghat se seedhe mandir pravesh behad aasan ho gaya hai.\n• **Ganga Aarti:** Dashashwamedh Ghat par shaam ki aarti boat se dekhna sabse divya anubhav hai.\n• **Kaal Bhairav:** Kashi yatra tabhi poori maani jaati hai jab Kaal Bhairav mandir ke darshan hon.\n\nAap kitne din ka trip plan kar rahe hain?`
  },
  {
    keywords: ["budget", "package", "rate", "cost", "kharcha", "price"],
    response: `Namaste! 🙏 Yatra Saathi ke popular teerth yatra packages:\n\n1. **Ayodhya Dham (2D/1N):** ₹3,999 / vyakti (Stay, Meals, Darshan assist)\n2. **Mata Vaishno Devi (4D/3N):** ₹8,499 / vyakti (Katra Hotel, Cab, Yatra assist)\n3. **Kedarnath Ex-Rishikesh (5D/4N):** ₹12,999 / vyakti (Transport, Hotel, Meals)\n4. **Complete Char Dham (10D/9N):** ₹24,999 / vyakti (Haridwar se Haridwar)\n\nAapko kis package ki details chahiye?`
  }
];

export async function askYatraAi(userMessage, conversationHistory = []) {
  const apiKey = (typeof import.meta !== "undefined" && import.meta.env?.VITE_GEMINI_API_KEY) || "AIzaSyC4RXhV2tv_Ukcd9w31qZxuOQgudzbG9GM";

  if (apiKey && apiKey.trim().length > 10) {
    const formattedHistory = conversationHistory
      .filter((msg) => msg.type === "user" || msg.type === "bot")
      .map((msg) => ({
        role: msg.type === "user" ? "user" : "model",
        parts: [{ text: msg.text }]
      }));

    const payload = {
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }]
      },
      contents: [
        ...formattedHistory,
        { role: "user", parts: [{ text: userMessage }] }
      ],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 600,
      }
    };

    // Try candidate models in cascade
    for (const model of CANDIDATE_MODELS) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          }
        );

        if (response.ok) {
          const data = await response.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) return reply;
        }
      } catch (err) {
        console.warn(`Model ${model} issue:`, err);
      }
    }
  }

  // Fallback check
  const lower = userMessage.toLowerCase();

  // If question is clearly out of domain in offline mode
  const outOfDomainKeywords = ["python", "javascript", "code", "cricket", "movie", "modi", "politics", "recipe", "bitcoin", "weather today", "stock"];
  if (outOfDomainKeywords.some((k) => lower.includes(k))) {
    return "Kshama kijiye, main sirf Teerth Yatra aur mandir darshan ki planning mein aapki madad kar sakta hoon. Kripya kisi pavitra yatra (jaise Ayodhya, Kedarnath, Vaishno Devi) se juda sawaal poochhein! 🙏";
  }

  for (const item of KNOWLEDGE_BASE) {
    if (item.keywords.some((k) => lower.includes(k))) {
      return item.response;
    }
  }

  return `Namaste! 🙏 Main aapki Teerth Yatra planning mein madad karne ke liye yahan hoon. Aap kis pavitra dham (jaise Ayodhya, Kedarnath, Vaishno Devi, Tirupati, Kashi) ke darshan ke liye yatra plan karna chahte hain?`;
}
