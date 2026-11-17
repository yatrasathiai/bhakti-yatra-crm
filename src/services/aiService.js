const SYSTEM_PROMPT = `Aap 'Yatra Saathi' hain, ek pavitra, vinamra aur param gyaani Teerth Yatra AI Sahayak (Spiritual Pilgrimage Assistant).
Aapka uddeshya Bharat ke pramukh teerth sthalon (jaise Ayodhya, Kedarnath, Badrinath, Vaishno Devi, Tirupati, Varanasi/Kashi, Vrindavan, Mathura, Jagannath Puri, Rameshwaram, Dwarka, Somnath aadi) ki yatra plan karne wale bhakton ko sahi margdarshan dena hai.

Nirdesh:
1. Tone & Bhasha: Sahaj, aadarpoorvak aur madhur Hinglish / Hindi. Prasang anusar "Namaste 🙏", "Jai Shri Ram", "Jai Mata Di", "Har Har Mahadev" ka prayog karein.
2. Jankari: Mandir ke darshan timings, aarti, VIP ticket rules, best season, senior citizen facilities (palki, battery car, helicopter), aur route ki sahi jaankari dein.
3. Yatra Planning: User ki pasand, dates aur family size ke hisaab se guidance dein.
4. Lead capture: Yatra plan discuss hone ke baad vinamrata se user ka naam aur WhatsApp/phone number poochhein taaki customized itinerary aur travel booking support share ki ja sake.
5. Format: Jawab concise, clear bullet points aur sundar format mein dein.`;

// Offline smart responses if API key is not yet configured
const OFFLINE_KNOWLEDGE = [
  {
    keywords: ["ayodhya", "ram mandir", "ram lalla"],
    response: `Jai Shri Ram! 🙏 Ayodhya Shri Ram Mandir darshan ke liye sabhi suvidhayein uplabdh hain:\n\n• **Darshan Timings:** Subah 6:30 AM se Dopahar 12:00 PM, phir Dopahar 2:00 PM se Raat 10:00 PM.\n• **Aarti:** Shringar Aarti (6:30 AM) aur Sandhya Aarti (7:30 PM) ke liye online pass official trust website se book kar sakte hain.\n• **Senior Citizens:** Wheelchair aur battery cart suvidha mandir parisar mein uplabdh hai.\n• **Nearest Airport/Station:** Ayodhya Dham Railway Station aur Maharishi Valmiki Airport.\n\nAap kis mahine mein yatra plan karna chahte hain?`
  },
  {
    keywords: ["vaishno", "mata", "katra", "bhawan"],
    response: `Jai Mata Di! 🙏 Mata Vaishno Devi yatra ke liye mukhya jaankari:\n\n• **Yatra Parchi:** Katra se RFID Yatra Card lena anivarya hai (online Shrine Board se bhi le sakte hain).\n• **Trek Distance:** Katra se Bhawan lagbhag 12-13 km ka trek hai.\n• **Suvidhayein:** Tarakote Marg par Battery Rickshaw, Ardhkuwari se Himkoti marg, aur Sanjichhat ke liye Helicopter seva available hai.\n• **Best Time:** March se October mausam behtar rehta hai, winters mein thand hoti hai.\n\nKitne yatri jaa rahe hain? Main aapke liye poora itinerary plan kar doon?`
  },
  {
    keywords: ["chardham", "kedarnath", "badrinath", "gangotri", "yamunotri"],
    response: `Har Har Mahadev! 🙏 Uttarakhand Char Dham Yatra ek divya anubhav hai:\n\n• **Dham Sequence:** Yamunotri ➔ Gangotri ➔ Kedarnath ➔ Badrinath.\n• **Registration:** Uttarakhand Tourism portal par biometric/online registration mandatory hai.\n• **Duration:** Haridwar/Rishikesh se 10 se 12 din lagte hain.\n• **Fitness & Health:** Kedarnath (16 km steep trek) ke liye medical checkup zaroori hai; Ghode, Palki aur Phata/Guptkashi se Heli-service bhi milti hai.\n• **Opening Season:** Kapat Akshay Tritiya (May) mein khulte hain aur Diwali/Bhai Dooj par band hote hain.\n\nKya aap complete 4 Dham plan kar rahe hain ya sirf Kedarnath-Badrinath (Do Dham)?`
  },
  {
    keywords: ["tirupati", "balaji", "venkateswara"],
    response: `Govinda Govinda! 🙏 Tirupati Balaji darshan ke mukhya sujhav:\n\n• **Special Entry Darshan (SED):** ₹300 wala ticket TTD official portal par lagbhag 3 mahine pehle open hota hai.\n• **Dress Code:** Men ke liye Dhoti/Kurta ya Pyjama-Kurta; Women ke liye Saree ya Churidar with Dupatta mandatory hai.\n• **Alipiri Footpath:** 3550 steps ka paidal rasta hai jo shraddhalu chalkar aate hain.\n• **Laddoo Prasadam:** Darshan ke baad token se prapt kiya ja sakta hai.\n\nAap kahan se travel karenge? Flight ya Train ki timings ke mutabik itinerary arrange karein?`
  },
  {
    keywords: ["budget", "package", "price", "kharcha", "rate"],
    response: `Yatra Saathi ke popular budget packages:\n\n1. **Ayodhya Dham:** ₹3,999 se shuru (2 Din · 1 Raat - Stay, Meals & Local Sightseeing)\n2. **Vaishno Devi:** ₹8,499 se shuru (4 Din · 3 Raat - Katra Hotel, Yatra assist)\n3. **Char Dham Yatra:** ₹24,999 se shuru (10 Din · 9 Raat - Haridwar se transport & stay)\n4. **Tirupati Balaji:** ₹9,999 se shuru (3 Din · 2 Raat - Chennai/Bangalore se)\n\nAapko kis package ki detailed itinerary chahiye?`
  }
];

export async function askYatraAi(userMessage, conversationHistory = [], customApiKey = null) {
  const apiKey = customApiKey || localStorage.getItem("yatra_gemini_api_key") || import.meta.env.VITE_GEMINI_API_KEY;

  if (apiKey && apiKey.trim().length > 10) {
    try {
      // Build Google Gemini API payload
      const formattedHistory = conversationHistory
        .filter((msg) => msg.type === "user" || msg.type === "bot")
        .map((msg) => ({
          role: msg.type === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        }));

      const payload = {
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        },
        contents: [
          ...formattedHistory,
          { role: "user", parts: [{ text: userMessage }] }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 600,
        }
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        // Fallback to gemini-1.5-flash if 2.5 is rate-limited or not available
        const fallbackRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          }
        );
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          return fallbackData.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf karein, jawab prapt nahi ho saka.";
        }
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply) return reply;
    } catch (err) {
      console.warn("Gemini API call failed, falling back to smart responder:", err);
    }
  }

  // Smart Offline Fallback
  const lower = userMessage.toLowerCase();
  for (const item of OFFLINE_KNOWLEDGE) {
    if (item.keywords.some((k) => lower.includes(k))) {
      return item.response;
    }
  }

  return `Namaste! 🙏 Main aapki Bhakti Yatra planning mein madad kar sakta hoon.\n\nAap kahan darshan ke liye jaana chahte hain? (Jaise Ayodhya, Vaishno Devi, Kedarnath, Char Dham, Tirupati, Kashi Varanasi).\n\n(Tip: Agar aapko real-time AI powers chahiye, toh upar '⚙️ AI Key' par click karke free Gemini key daal sakte hain!)`;
}
