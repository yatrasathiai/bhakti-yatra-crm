import { useEffect, useRef, useState } from "react";
import { askYatraAi } from "./services/aiService";

const destinations = [
  { id: "ayodhya", name: "Ayodhya", hindi: "Ram ki Nagri", days: "2 din · 1 raat", price: "₹3,999", from: "Delhi se", icon: "ॐ", tone: "peach" },
  { id: "vaishno", name: "Vaishno Devi", hindi: "Mata ka Dham", days: "4 din · 3 raat", price: "₹8,499", from: "Delhi se", icon: "श्री", tone: "lavender" },
  { id: "chardham", name: "Char Dham", hindi: "Himalaya Yatra", days: "10 din · 9 raat", price: "₹24,999", from: "Haridwar se", icon: "ॐ", tone: "sage" },
  { id: "tirupati", name: "Tirupati", hindi: "Balaji Darshan", days: "3 din · 2 raat", price: "₹9,999", from: "Chennai se", icon: "श्री", tone: "gold" },
];

const initialMessages = [
  { type: "bot", text: "Namaste! 🙏 Main 'Yatra Saathi' hoon — aapka AI Spiritual Tour Guide.\n\nBharat ke kisi bhi teerth sthal (Ayodhya, Vaishno Devi, Kedarnath, Char Dham, Tirupati, Kashi) ke darshan, booking rules, best time aur budget packages ke baare mein kuch bhi poochiye!" },
];

function Icon({ name, size = 18 }) {
  const paths = {
    arrow: <><path d="M4 12h15"/><path d="m13 5 7 7-7 7"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    send: <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,
    sparkle: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z"/><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8Z"/></>,
    key: <><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.arrow}</svg>;
}

function PilgrimageArt() {
  return (
    <svg className="pilgrimage-art" viewBox="0 0 760 480" role="img" aria-label="Sunrise over Himalayan mountains and a temple">
      <defs>
        <linearGradient id="sky" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#F9D9A8"/><stop offset="1" stopColor="#F7A86B"/></linearGradient>
        <linearGradient id="mountain" x1="0" x2=".8" y1="0" y2="1"><stop stopColor="#627B68"/><stop offset="1" stopColor="#294A45"/></linearGradient>
        <linearGradient id="river" x1="0" x2="1"><stop stopColor="#B4D9C8"/><stop offset="1" stopColor="#E2D0A7"/></linearGradient>
        <filter id="soft"><feGaussianBlur stdDeviation="22"/></filter>
      </defs>
      <rect width="760" height="480" rx="32" fill="url(#sky)"/>
      <circle cx="540" cy="135" r="76" fill="#FFF4D7" opacity=".78" filter="url(#soft)"/><circle cx="540" cy="135" r="47" fill="#FFF1CD"/>
      <path d="M0 285 143 135l89 95 90-121 127 157 101-117 210 145v186H0Z" fill="#B98B70" opacity=".52"/>
      <path d="m0 308 153-144 83 93 91-116 121 149 100-115 212 135v170H0Z" fill="url(#mountain)"/>
      <path d="m91 223 62-59 48 54-33-12-18 15-16-17-15 23ZM262 187l65-69 59 73-38-21-23 24-19-18-21 24ZM491 196l57-58 49 57-30-18-18 19-19-17-15 20Z" fill="#FFF0D4" opacity=".9"/>
      <path d="M0 337c112-38 173-17 275 8 102 24 161-44 262-35s155 50 223 17v153H0Z" fill="#3E6353"/>
      <path d="M210 480c49-43 96-72 144-86 66-19 118 0 187-31 65-29 144-28 219-10v127Z" fill="url(#river)" opacity=".9"/>
      <path d="M275 480c61-38 102-66 162-78 50-10 90-10 141-36" fill="none" stroke="#FFF9E8" strokeWidth="4" strokeDasharray="8 12" opacity=".75"/>
      <g transform="translate(96 244)" fill="#F8E6C7" stroke="#3E5143" strokeWidth="3" strokeLinejoin="round">
        <path d="M0 75h148v7H0z"/><path d="M14 72V38l20-20 20 20v34M54 72V29l20-23 20 23v43M94 72V38l20-20 20 20v34"/>
        <path d="M4 38h60M45 29h59M85 38h59"/><path d="M73 6v-9m-4 0h8" fill="none"/>
        <path d="M28 72V51m38 21V43m38 29V51" fill="none" stroke="#B15F3A" strokeWidth="4"/>
      </g>
      <g fill="#FFF8E8" opacity=".88"><circle cx="664" cy="76" r="3"/><circle cx="612" cy="214" r="2"/><circle cx="703" cy="234" r="3"/><circle cx="46" cy="108" r="2"/></g>
    </svg>
  );
}

function PackageCard({ tour, onChoose, compact = false }) {
  return (
    <button className={`package-card ${compact ? "package-card-compact" : ""}`} onClick={() => onChoose(tour)}>
      <span className={`package-art ${tour.tone}`}><span>{tour.icon}</span></span>
      <span className="package-copy">
        <span className="package-hindi">{tour.hindi}</span>
        <strong>{tour.name}</strong>
        <span className="package-meta"><Icon name="clock" size={14}/>{tour.days} · {tour.from}</span>
      </span>
      <span className="package-rate"><strong>{tour.price}<small>*</small></strong><span>/ vyakti se</span></span>
    </button>
  );
}

function Bubble({ message }) { 
  return <div className={`message ${message.type}`}>{message.text}</div>; 
}

export default function App() {
  const [messages, setMessages] = useState(initialMessages);
  const [quickReplies, setQuickReplies] = useState([
    "Ayodhya darshan timings kya hain?",
    "Kedarnath yatra ki jankari",
    "Vaishno Devi yatra rules",
    "Popular Packages dekhein"
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("yatra_gemini_api_key") || "");
  const [tempKey, setTempKey] = useState("");
  const [showKeyModal, setShowKeyModal] = useState(false);

  const messageEndRef = useRef(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const addMessage = (type, text) => {
    const newMsg = { type, text, id: `${Date.now()}-${Math.random()}` };
    setMessages((current) => [...current, newMsg]);
    return newMsg;
  };

  const saveApiKey = (keyToSave) => {
    const cleaned = keyToSave.trim();
    setApiKey(cleaned);
    if (cleaned) {
      localStorage.setItem("yatra_gemini_api_key", cleaned);
    } else {
      localStorage.removeItem("yatra_gemini_api_key");
    }
    setShowKeyModal(false);
    addMessage("bot", cleaned ? "Jai Shri Ram! 🙏 Aapki Gemini AI Key successfully connect ho gayi hai. Ab aap poori tarah se live smart AI ke sath yatra plan kar sakte hain!" : "API Key reset kar di gayi hai. Smart offline mode active hai.");
  };

  const handleSend = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    setInput("");
    const userMsg = { type: "user", text, id: `${Date.now()}-${Math.random()}` };
    const currentHistory = [...messages, userMsg];
    setMessages(currentHistory);
    setLoading(true);

    // If user asked to see packages
    if (/packages|yatra packages/i.test(text)) {
      setLoading(false);
      addMessage("bot", "Yeh hamari sabse lokpriya teerth yatra packages hain:");
      setMessages((curr) => [
        ...curr,
        ...destinations.map((tour) => ({ type: "package", tour, id: `${tour.id}-${Date.now()}` }))
      ]);
      setQuickReplies(["Ayodhya details", "Kedarnath rules", "Custom package rate"]);
      return;
    }

    try {
      const aiReply = await askYatraAi(text, currentHistory, apiKey);
      addMessage("bot", aiReply);

      // Context-aware dynamic suggestions
      if (/ayodhya/i.test(text)) {
        setQuickReplies(["Ayodhya Ram Mandir Aarti pass kaise milega?", "Delhi se Ayodhya package rate", "Senior citizen facilities"]);
      } else if (/kedarnath|chardham/i.test(text)) {
        setQuickReplies(["Helicopter ticket kaise book karein?", "Char Dham registration link", "Senior citizens ke liye palki"]);
      } else if (/vaishno/i.test(text)) {
        setQuickReplies(["Battery car booking", "Ardhkuwari darshan time", "Vaishno Devi package details"]);
      } else {
        setQuickReplies(["Packages dekhein", "Ayodhya yatra", "Kedarnath guide", "Custom budget plan"]);
      }
    } catch {
      addMessage("bot", "Maaf karein, network mein kuch samasya aayi. Kripya punah prayas karein.");
    } finally {
      setLoading(false);
    }
  };

  const chooseTour = (tour) => {
    handleSend(`${tour.name} yatra package ke baare mein vistar se batayein`);
  };

  const jumpToChat = () => {
    document.querySelector("#assistant")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="site-shell">
      {/* TOPBAR */}
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Yatra Saathi home">
          <span className="brand-mark">ॐ</span>
          <span>
            <strong>Yatra Saathi</strong>
            <small>AI-Powered Devotional Journey Planner</small>
          </span>
        </a>
        <nav className="nav-links" aria-label="Main navigation">
          <a href="#destinations">Yatra places</a>
          <a href="#how-it-works">How it works</a>
        </nav>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button 
            className="api-key-btn" 
            onClick={() => { setTempKey(apiKey); setShowKeyModal(true); }}
            title="Configure Gemini API Key"
          >
            <Icon name="key" size={14}/>
            {apiKey ? "AI Connected (Gemini)" : "⚙️ Connect AI Key (Free)"}
          </button>
          <button className="nav-cta" onClick={jumpToChat}>
            Plan a Yatra <Icon name="arrow" size={16}/>
          </button>
        </div>
      </header>

      {/* API KEY CONFIG MODAL */}
      {showKeyModal && (
        <div className="modal-overlay" onClick={() => setShowKeyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Connect Free Gemini AI Model</h3>
              <button className="close-btn" onClick={() => setShowKeyModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Apna Google Gemini API Key yahan paste karein taaki Yatra Saathi real live AI ban sake:</p>
              <ul style={{ margin: "10px 0 14px 20px" }}>
                <li>Yeh <strong>100% Free</strong> hai.</li>
                <li><a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: "var(--brand-primary)", fontWeight: "600" }}>Google AI Studio se 1-click mein Free Key lein ↗</a></li>
              </ul>
              <input 
                type="password"
                className="modal-input" 
                placeholder="AIzaSy..." 
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => saveApiKey("")}>Clear / Offline Mode</button>
              <button className="btn-primary" onClick={() => saveApiKey(tempKey)}>Save & Connect</button>
            </div>
          </div>
        </div>
      )}

      <main id="top">
        {/* HERO SECTION */}
        <section className="hero wrap">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot"/>Pavitra Teerth Yatra Sahayak</div>
            <h1>Safar bhakti ka.<br/><em>Planning</em> aasaan.</h1>
            <p className="hero-description">
              Darshan ka iraada ho, planning ki chinta nahi. Yatra Saathi AI aapko har teerth sthal ke darshan timings, packages, routes aur booking process ki poori jankari deta hai.
            </p>
            <div className="hero-actions">
              <button className="button-primary" onClick={jumpToChat}>
                Apni Yatra Plan Karein <Icon name="arrow" size={17}/>
              </button>
              <a className="text-link" href="#destinations">Popular Yatras Dekhein <span>↓</span></a>
            </div>
            <div className="hero-assurance">
              <span className="assurance-icon"><Icon name="sparkle"/></span>
              <span><strong>AI Guidance + Authentic Yatra Info</strong><small>Darshan, passes, hotels aur itineraries ek jagah</small></span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="art-frame">
              <PilgrimageArt/>
              <div className="art-label">
                <span className="art-label-icon">✦</span>
                <span><strong>Find your moment of peace</strong><small>Har yatra ki shuruaat ek shubh sankalp se</small></span>
              </div>
            </div>
            <div className="floating-note">
              <span className="floating-note-icon">ॐ</span>
              <span><small>Smart AI Travel Guide</small><strong>Ek kadam darshan ki ore</strong></span>
            </div>
            <div className="sun-doodle" aria-hidden="true">✳</div>
          </div>

          {/* CHATBOT SECTION */}
          <section className="assistant-card" id="assistant" aria-label="Yatra planning chatbot">
            <div className="assistant-top">
              <div className="assistant-avatar">ॐ</div>
              <div className="assistant-heading">
                <strong>Yatra Saathi (AI Devotional Guide)</strong>
                <span><i/> {apiKey ? "Live Gemini AI Active" : "Smart Offline Assistant"}</span>
              </div>
              <button 
                className="api-key-btn" 
                onClick={() => { setTempKey(apiKey); setShowKeyModal(true); }}
              >
                <Icon name="key" size={13}/> {apiKey ? "Key Active" : "Add Free Key"}
              </button>
            </div>

            <div className="assistant-context">
              <span className="context-spark">✦</span>
              <span>
                <strong>Namaste! Kahan darshan ke liye chalna hai?</strong>
                <small>Ayodhya, Kedarnath, Vaishno Devi ya kisi bhi mandir ke baare mein poochiye.</small>
              </span>
            </div>

            <div className="chat-feed" aria-live="polite">
              {messages.map((message) => 
                message.type === "package" ? (
                  <div className="chat-package-wrap" key={message.id}>
                    <PackageCard tour={message.tour} onChoose={chooseTour} compact/>
                  </div>
                ) : (
                  <Bubble message={message} key={message.id || message.text}/>
                )
              )}
              {loading && (
                <div className="message loading">
                  <span>Yatra Saathi vichar kar raha hai... ॐ</span>
                </div>
              )}
              <div ref={messageEndRef}/>
            </div>

            {/* QUICK SUGGESTIONS */}
            <div className="suggestion-row">
              {quickReplies.map((reply) => (
                <button className="suggestion" key={reply} onClick={() => handleSend(reply)}>
                  {reply} <span>↗</span>
                </button>
              ))}
            </div>

            {/* CHAT COMPOSER */}
            <form className="chat-composer" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
              <input 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder="Apna sawaal ya yatra destination likhein..." 
                aria-label="Message Yatra Saathi" 
                autoComplete="off"
              />
              <button type="submit" aria-label="Send message" disabled={!input.trim() || loading}>
                <Icon name="send" size={17}/>
              </button>
            </form>

            <div className="chat-footnote">
              <span>✦</span> Powered by Gemini AI · Bhakti Yatra Samadhan
            </div>
          </section>
        </section>

        {/* POPULAR DESTINATIONS */}
        <section className="destination-section wrap" id="destinations">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Aapki agli manzil</div>
              <h2>Popular Teerth Yatra Packages</h2>
            </div>
            <a className="view-all" href="#assistant" onClick={jumpToChat}>
              Sabhi Options Poochhein <Icon name="arrow" size={16}/>
            </a>
          </div>
          <div className="destination-grid">
            {destinations.map((tour) => (
              <PackageCard key={tour.id} tour={tour} onChoose={chooseTour}/>
            ))}
          </div>
          <p className="price-disclaimer">* Package rates demo rates hain. Detailed itinerary aur actual booking ke liye chat par sampark karein.</p>
        </section>

        {/* HOW IT WORKS */}
        <section className="how-section" id="how-it-works">
          <div className="wrap how-inner">
            <span>01 · Destination aur darshan dates chunein</span>
            <span>02 · Yatra Saathi AI se route & budget samjhein</span>
            <span>03 · Hassle-free aarti & stay booking payein</span>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="footer wrap">
        <a className="brand footer-brand" href="#top">
          <span className="brand-mark">ॐ</span>
          <span><strong>Yatra Saathi</strong><small>Bhakti, bina kisi uljhan ke.</small></span>
        </a>
        <span>Made for Sacred Journeys <b>✦</b> Har Har Mahadev</span>
      </footer>
    </div>
  );
}
