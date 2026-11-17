const SYSTEM_PROMPT = `Aap 'Yatra Saathi' hain, ek pavitra, vinamra aur param gyaani Teerth Yatra AI Sahayak (Spiritual Pilgrimage Assistant).
Aapka uddeshya Bharat ke pramukh teerth sthalon (jaise Ayodhya, Kedarnath, Badrinath, Vaishno Devi, Tirupati, Varanasi/Kashi, Vrindavan, Mathura, Jagannath Puri, Rameshwaram, Dwarka, Somnath aadi) ki yatra plan karne wale bhakton ko sahi margdarshan dena hai.

Nirdesh:
1. Tone & Bhasha: Sahaj, aadarpoorvak aur madhur Hinglish / Hindi. Prasang anusar "Namaste 🙏", "Jai Shri Ram", "Jai Mata Di", "Har Har Mahadev" ka prayog karein.
2. Jankari: Mandir ke darshan timings, aarti, VIP ticket rules, best season, senior citizen facilities (palki, battery car, helicopter), aur route ki sahi jaankari dein.
3. Yatra Planning: User ki pasand, dates aur family size ke hisaab se guidance dein.
4. Lead capture: Yatra plan discuss hone ke baad vinamrata se user ka naam aur WhatsApp/phone number poochhein taaki customized itinerary aur travel booking support share ki ja sake.
5. Format: Jawab concise, clear points aur sundar format mein dein.`;

// Cascade of models from newest to most stable
const CANDIDATE_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
];

const KNOWLEDGE_BASE = [
  {
    keywords: ["ayodhya", "ram mandir", "ram lalla"],
    response: `Jai Shri Ram! 🙏 Ayodhya Shri Ram Janmabhoomi darshan ke liye pramukh jaankari:\n\n• **Darshan Timings:** Subah 6:30 AM se Dopahar 12:00 PM, phir Dopahar 2:00 PM se Raat 10:00 PM tak.\n• **Aarti Samay:** Mangala Aarti (4:30 AM), Shringar Aarti (6:30 AM), aur Sandhya Aarti (7:30 PM). Aarti pass trust ki website se online book hota hai.\n• **Senior Citizens:** Mandir parisar mein wheelchair aur battery operated carts uplabdh hain.\n• **Yatra Route:** Maharishi Valmiki International Airport aur Ayodhya Dham Railway station seedha connect hain.\n\nAap kahan se yatra plan kar rahe hain?`
  },
  {
    keywords: ["kedarnath", "chardham", "badri", "gangotri", "yamunotri"],
    response: `Har Har Mahadev! 🙏 Kedarnath & Char Dham yatra ke liye mukhya guidelines:\n\n• **Registration:** Uttarakhand Tourism ke official portal par biometric/online registration sabhi yatriyon ke liye zaroori hai.\n• **Kedarnath Trek:** Gaurikund se lagbhag 16-18 km ka paidal trek hai. Ghode, palki aur helicopter seva (Phata, Sirsi, Guptkashi se) uplabdh rehti hai.\n• **Best Season:** May-June aur September-October (Monsoon/July-August mein landslides ka risk rehta hai).\n• **Warm Clothing:** Mausam pal bhar mein badalta hai, thermal innerwear aur rain gear zaroor lein.\n\nKya aap sirf Kedarnath jana chahte hain ya poora Char Dham?`
  },
  {
    keywords: ["vaishno", "mata", "katra", "bhawan"],
    response: `Jai Mata Di! 🙏 Mata Vaishno Devi yatra ke zaroori niyam:\n\n• **Yatra RFID Card:** Katra counter ya online Shrine Board portal se RFID card lena mandatory hai.\n• **Trek Distance:** Katra se Bhawan lagbhag 12-13 km hai.\n• **Alternate Routes:** Tarakote Marg paidal ke liye suvidhajanak hai. Ardhkuwari se battery car aur Sanjichhat ke liye Helicopter suvidha milti hai.\n• **Ropeway:** Bhawan se Bhairon Baba mandir ke liye ropeway ticket counter par uplabdh rehta hai.\n\nKitne log travel kar rahe hain? Main stay aur cab arrangement guide kar doon?`
  },
  {
    keywords: ["tirupati", "balaji", "venkateswara"],
    response: `Govinda Govinda! 🙏 Tirupati Sri Venkateswara Swamy darshan details:\n\n• **Special Entry Darshan (SED):** ₹300 ka pass TTD official portal par har mahine advance release hota hai.\n• **Dress Code:** Men ke liye White Dhoti/Kurta ya Pyjama; Women ke liye Saree ya Chudidar with Dupatta mandatory hai.\n• **Tirumala Hills:** Alipiri aur Srivari Mettu marg se paidal yatra bhi kar sakte hain.\n• **Laddu Prasadam:** Darshan ke baad har ticket par prasadam counter se milta hai.\n\nAap flight se Chennai/Tirupati aa rahe hain ya train se?`
  },
  {
    keywords: ["kashi", "varanasi", "vishwanath"],
    response: `Har Har Mahadev! 🙏 Kashi Vishwanath Dham & Varanasi darshan:\n\n• **Kashi Vishwanath Corridor:** Naya corridor banne ke baad Ganga Ghat se seedhe mandir pravesh aasan ho gaya hai.\n• **Mangla Aarti:** Subah 3:00 AM se 4:00 AM — iska pass 1 mahine pehle online book karna padta hai.\n• **Ganga Aarti:** Dashashwamedh Ghat par shaam 6:45 PM par divya aarti hoti hai jise naav (boat) se dekhna sabse sundar anubhav hai.\n• **Kaal Bhairav:** Kashi yatra tabhi poori maani jaati hai jab Kaal Bhairav mandir ke darshan karein.\n\nAap kitne din ka trip plan kar rahe hain?`
  },
  {
    keywords: ["budget", "package", "rate", "cost", "kharcha", "price"],
    response: `Namaste! 🙏 Yatra Saathi ke popular custom pilgrimage packages:\n\n1. **Ayodhya Dham (2D/1N):** ₹3,999 / person (Stay, Breakfast, Mandir Darshan assist)\n2. **Mata Vaishno Devi (4D/3N):** ₹8,499 / person (Katra Stay, Cab pickup, Yatra assist)\n3. **Kedarnath Ex-Rishikesh (5D/4N):** ₹12,999 / person (Transport, Hotel, Meals)\n4. **Complete Char Dham (10D/9N):** ₹24,999 / person (Haridwar se Haridwar)\n\nAapko kis package ki detailed itinerary aur dates chahiye?`
  }
];

export async function askYatraAi(userMessage, conversationHistory = []) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyC4RXhV2tv_Ukcd9w31qZxuOQgudzbG9GM";

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
        temperature: 0.7,
        maxOutputTokens: 700,
      }
    };

    // Try newest models first with automatic fallback if busy
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
        console.warn(`Model ${model} unavailable, trying next:`, err);
      }
    }
  }

  // Fallback knowledge base if all external calls fail
  const lower = userMessage.toLowerCase();
  for (const item of KNOWLEDGE_BASE) {
    if (item.keywords.some((k) => lower.includes(k))) {
      return item.response;
    }
  }

  return `Namaste! 🙏 Main aapki Bhakti Yatra planning mein madad karne ke liye yahan hoon.\n\nAap kis pavitra dham (jaise Ayodhya, Kedarnath, Vaishno Devi, Tirupati, Kashi, Vrindavan) ki yatra plan karna chahte hain? Mujhe batayein, main aapko darshan timings, packages aur routes ki poori jankari doonga!`;
}
