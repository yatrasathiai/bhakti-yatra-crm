import { useEffect, useState } from "react";
import Chatbot from "./components/Chatbot";
import CrmDashboard from "./components/CrmDashboard";

const ADMIN_PIN = "1234";

function checkIsAdmin() {
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  return path === "/admin" || path.startsWith("/admin/") || hash === "#admin";
}

function PinLock({ onUnlock, onCancel }) {
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
        <h3>Yatra Saathi Admin CRM</h3>
        <p>Admin panel mein pravesh ke liye PIN daalein</p>
        <input
          className="pin-input"
          type="password"
          maxLength={4}
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, ""));
            setError("");
          }}
          placeholder="• • • •"
          autoFocus
        />
        {error && <div className="pin-error">{error}</div>}
        <button type="submit" className="pin-submit">
          Unlock Dashboard 🔓
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            marginTop: "12px",
            background: "none",
            border: "none",
            color: "#7E726A",
            fontSize: "0.85rem",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          ← Wapas Website Par Jayein
        </button>
      </form>
    </div>
  );
}

export default function App() {
  const [route, setRoute] = useState(checkIsAdmin() ? "admin" : "home");
  const [isAuth, setIsAuth] = useState(
    () => sessionStorage.getItem("yatra_crm_auth") === "true"
  );

  // Sync with browser URL changes
  useEffect(() => {
    const handleLocationChange = () => {
      setRoute(checkIsAdmin() ? "admin" : "home");
    };

    window.addEventListener("popstate", handleLocationChange);
    window.addEventListener("hashchange", handleLocationChange);
    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("hashchange", handleLocationChange);
    };
  }, []);

  const navigateToHome = () => {
    window.history.pushState({}, "", "/");
    setRoute("home");
  };

  // If URL is /admin or #admin
  if (route === "admin") {
    if (!isAuth) {
      return (
        <PinLock
          onUnlock={() => setIsAuth(true)}
          onCancel={navigateToHome}
        />
      );
    }
    return <CrmDashboard onSwitchToChat={navigateToHome} />;
  }

  // Default: Pure Public Chatbot View
  return (
    <div className="chat-app-root">
      <Chatbot />
    </div>
  );
}
