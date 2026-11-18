import { useState } from "react";
import "./PinLock.css";

const ADMIN_PIN = "1234";

export default function PinLock({ onUnlock, onCancel }) {
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
    <div className="pin-screen-wrapper">
      <div className="pin-card-box">
        <div className="pin-brand-icon">ॐ</div>
        <h2>Yatra Saathi CRM</h2>
        <p>Admin panel mein pravesh ke liye apna 4-digit security PIN darj karein</p>

        <form className="pin-form" onSubmit={handleSubmit}>
          <input
            className="pin-digit-input"
            type="password"
            maxLength={4}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, ""));
              setError("");
            }}
            placeholder="• • • •"
            autoComplete="off"
            name="admin-pin-field"
            autoFocus
          />

          {error && <div className="pin-error-badge">{error}</div>}

          <button type="submit" className="pin-unlock-btn">
            Unlock Dashboard 🔓
          </button>

          <button type="button" className="pin-back-link" onClick={onCancel}>
            ← Wapas Website Par Jayein
          </button>
        </form>

        <div className="pin-hint-tag">
          Default Admin PIN: <strong>1234</strong>
        </div>
      </div>
    </div>
  );
}
