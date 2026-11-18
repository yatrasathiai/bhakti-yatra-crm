import { useEffect, useState } from "react";
import Chatbot from "./components/Chatbot";
import CrmDashboard from "./components/CrmDashboard";
import { fetchLeads } from "./services/databaseService";

const ADMIN_PIN = "1234"; // Default admin PIN

function PinLock({ onUnlock }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem("yatra_crm_auth", "true");
      onUnlock();
    } else {
      setError("Galat PIN! Kripya sahi PIN daalein.");
      setPin("");
    }
  };

  return (
    <div className="pin-overlay">
      <form className="pin-box" onSubmit={handleSubmit}>
        <div className="pin-logo">ॐ</div>
        <h3>Yatra Saathi CRM</h3>
        <p>Admin Dashboard mein aane ke liye PIN daalein</p>
        <input
          className="pin-input"
          type="password"
          maxLength={4}
          value={pin}
          onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setError(""); }}
          placeholder="• • • •"
          autoFocus
        />
        {error && <div className="pin-error">{error}</div>}
        <button type="submit" className="pin-submit">Unlock Dashboard 🔓</button>
      </form>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("chat"); // "chat" | "pin" | "crm"
  const [leadCount, setLeadCount] = useState(0);

  // Load lead count for badge
  useEffect(() => {
    fetchLeads().then((leads) => setLeadCount(leads.length));
    const interval = setInterval(() => {
      fetchLeads().then((leads) => setLeadCount(leads.length));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const switchToCrm = () => {
    if (sessionStorage.getItem("yatra_crm_auth") === "true") {
      setView("crm");
    } else {
      setView("pin");
    }
  };

  if (view === "pin") {
    return <PinLock onUnlock={() => setView("crm")} />;
  }

  if (view === "crm") {
    return <CrmDashboard onSwitchToChat={() => setView("chat")} />;
  }

  return (
    <div className="chat-app-root">
      <Chatbot
        onSwitchToCrm={switchToCrm}
        leadCount={leadCount}
      />
    </div>
  );
}
