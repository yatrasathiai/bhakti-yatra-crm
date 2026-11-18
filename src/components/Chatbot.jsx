import { useEffect, useRef, useState } from "react";
import { askYatraAi } from "../services/aiService";
import { extractLeadFromChat } from "../services/leadExtractor";
import { createLead } from "../services/databaseService";
import "./Chatbot.css";

const POPULAR_TOURS = [
  { id: "ayodhya", name: "Ayodhya Dham", hindi: "Ram Lalla Darshan", days: "2 Din · 1 Raat", price: "₹3,999", from: "Delhi se", icon: "ॐ" },
  { id: "vaishno", name: "Mata Vaishno Devi", hindi: "Katra Dham", days: "4 Din · 3 Raat", price: "₹8,499", from: "Delhi se", icon: "🌸" },
  { id: "chardham", name: "Char Dham Yatra", hindi: "Himalaya Darshan", days: "10 Din · 9 Raat", price: "₹24,999", from: "Haridwar se", icon: "🏔️" },
  { id: "tirupati", name: "Tirupati Balaji", hindi: "Venkateswara Swamy", days: "3 Din · 2 Raat", price: "₹9,999", from: "Chennai se", icon: "✨" },
];

function formatTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function FormattedText({ text }) {
  if (!text) return null;
  const lines = text.split("\n");
  return (
    <div>
      {lines.map((line, idx) => {
        if (!line.trim()) return <div key={idx} style={{ height: "6px" }} />;
        const parts = line.split(/(\*\*.*?\*\*)/g);
        const parsed = parts.map((part, pIdx) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={pIdx} style={{ color: "#2B1808" }}>{part.slice(2, -2)}</strong>;
          }
          return part;
        });
        return <div key={idx} style={{ marginBottom: "3px" }}>{parsed}</div>;
      })}
    </div>
  );
}

export default function Chatbot({ onSelectPackage }) {
  const [messages, setMessages] = useState([
    {
      type: "bot",
      text: "Namaste! 🙏 Main 'Yatra Saathi' hoon — aapka Devotional Travel Guide.\n\nBharat ke kisi bhi teerth sthal (Ayodhya, Kedarnath, Vaishno Devi, Tirupati, Kashi, Vrindavan) ke darshan timings, packages, routes aur budget ke baare mein kuch bhi poochiye!",
      time: formatTime(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);
  const [chips, setChips] = useState([
    "✨ Ayodhya Ram Mandir",
    "🏔️ Kedarnath Guide",
    "🌸 Vaishno Devi",
    "💰 Popular Packages",
  ]);

  const bodyRef = useRef(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const addMessage = (type, text, extra = {}) => {
    const msg = { type, text, time: formatTime(), id: `${Date.now()}-${Math.random()}`, ...extra };
    setMessages((curr) => [...curr, msg]);
    return msg;
  };

  // Try to extract & save lead after every user message
  const tryCaptureLead = async (allMessages) => {
    if (leadSaved) return;

    try {
      const extracted = await extractLeadFromChat(allMessages);
      if (extracted && (extracted.name || extracted.phone)) {
        await createLead(extracted);
        setLeadSaved(true);

        addMessage(
          "bot",
          `Dhanyavaad${extracted.name ? " " + extracted.name + " ji" : ""} 🙏\n\nAapki enquiry humari team ke paas pahunch gayi hai. Jald hi humara yatra coordinator aapse${extracted.phone ? " " + extracted.phone + " par" : ""} contact karega aur aapke liye best yatra plan taiyaar karega!\n\nHar Har Mahadev! 🙏`
        );
      }
    } catch (err) {
      console.warn("Lead capture attempt:", err);
    }
  };

  const handleSend = async (messageText) => {
    const query = (messageText || input).trim();
    if (!query || loading) return;

    setInput("");
    const userMsg = { type: "user", text: query, time: formatTime(), id: `${Date.now()}-${Math.random()}` };
    const history = [...messages, userMsg];
    setMessages(history);
    setLoading(true);

    if (/package|packages|tour|rate/i.test(query) && !/details|timing|pass/i.test(query)) {
      setTimeout(() => {
        setLoading(false);
        addMessage("bot", "Yeh hamare sabse lokpriya teerth packages hain. Kisi bhi package par tap karke details jaaniye:", { showPackages: true });
        setChips(["Ayodhya package", "Kedarnath trek tips", "Vaishno Devi helicopter", "Custom yatra plan"]);
      }, 400);
      return;
    }

    try {
      const response = await askYatraAi(query, history);
      addMessage("bot", response);

      const lower = query.toLowerCase();
      if (lower.includes("ayodhya") || lower.includes("ram")) {
        setChips(["Aarti pass kaise milega?", "Delhi to Ayodhya route", "VIP darshan rules", "Ayodhya packages"]);
      } else if (lower.includes("kedarnath") || lower.includes("chardham")) {
        setChips(["Helicopter booking", "Char Dham registration", "Senior citizens ke liye palki", "Best season to visit"]);
      } else if (lower.includes("vaishno")) {
        setChips(["Battery rickshaw booking", "Ardhkuwari cave time", "Mata Vaishno Devi package"]);
      } else {
        setChips(["Popular Packages", "Kedarnath trip", "Ayodhya Dham", "Tirupati Balaji"]);
      }

      tryCaptureLead([...history, { type: "bot", text: response }]);
    } catch {
      addMessage("bot", "Kshama karein, network mein kuch samasya aayi. Kripya punah koshish karein.");
    } finally {
      setLoading(false);
    }
  };

  const selectTour = (tour) => {
    if (onSelectPackage) onSelectPackage(tour);
    handleSend(`${tour.name} package ke baare mein poori details, dates aur itinerary batayein`);
  };

  const clearChat = () => {
    setLeadSaved(false);
    setMessages([
      {
        type: "bot",
        text: "Namaste! 🙏 Chat reset ho gaya hai. Aap nayi yatra plan karne ke liye sawaal pooch sakte hain.",
        time: formatTime(),
      },
    ]);
  };

  return (
    <div className="yatra-chat-card">
      {/* HEADER — 100% PURE PUBLIC INTERFACE */}
      <div className="yatra-chat-header">
        <div className="yatra-chat-brand">
          <div className="yatra-chat-avatar">
            ॐ
            <span className="online-pulse" title="Yatra Saathi is online" />
          </div>
          <div className="yatra-chat-info">
            <h3>
              Yatra Saathi AI
              <span className="verified-badge">Teerth Guide</span>
            </h3>
            <p>● Always Online · Instant Devotional Assistant</p>
          </div>
        </div>

        <div className="yatra-chat-actions">
          <button className="yatra-btn-icon" onClick={clearChat} title="Clear Chat">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* CHAT LOG */}
      <div className="yatra-chat-body" ref={bodyRef}>
        {messages.map((msg) => (
          <div key={msg.id || msg.time} className={`yatra-msg-row ${msg.type}`}>
            <div className="yatra-msg-avatar">{msg.type === "bot" ? "ॐ" : "👤"}</div>
            <div className="yatra-msg-content">
              <div className="yatra-bubble">
                <FormattedText text={msg.text} />
                {msg.showPackages && (
                  <div className="yatra-mini-packages">
                    {POPULAR_TOURS.map((tour) => (
                      <div key={tour.id} className="yatra-mini-card" onClick={() => selectTour(tour)}>
                        <div className="yatra-mini-top">
                          <span className="yatra-mini-icon">{tour.icon}</span>
                          <div>
                            <strong>{tour.name}</strong>
                            <div className="yatra-mini-meta">{tour.days}</div>
                          </div>
                        </div>
                        <div className="yatra-mini-bottom">
                          <span className="yatra-mini-price">{tour.price}</span>
                          <span className="yatra-mini-btn">Details ↗</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <span className="yatra-msg-time">{msg.time}</span>
            </div>
          </div>
        ))}
        {loading && (
          <div className="yatra-msg-row bot">
            <div className="yatra-msg-avatar">ॐ</div>
            <div className="yatra-msg-content">
              <div className="yatra-typing-bubble">
                <span className="yatra-dot" /><span className="yatra-dot" /><span className="yatra-dot" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CHIPS */}
      <div className="yatra-chips-container">
        {chips.map((chip, idx) => (
          <button key={idx} className="yatra-chip" onClick={() => handleSend(chip)}>{chip}</button>
        ))}
      </div>

      {/* COMPOSER */}
      <div className="yatra-chat-footer">
        <form className="yatra-input-wrapper" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
          <input
            className="yatra-input-field"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Apna sawaal poochiye (jaise Kedarnath yatra, Ayodhya aarti)..."
            aria-label="Ask Yatra Saathi"
          />
          <button type="submit" className="yatra-send-btn" disabled={!input.trim() || loading} aria-label="Send message">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
            </svg>
          </button>
        </form>
        <div className="yatra-footer-caption">
          <span>✦ Powered by Yatra Saathi AI</span> · <span>Har Har Mahadev 🙏</span>
        </div>
      </div>
    </div>
  );
}
