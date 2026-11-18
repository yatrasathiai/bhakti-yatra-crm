import { useState, useRef } from "react";
import "./PinLock.css";

function getAdminPin() {
  return localStorage.getItem("yatra_admin_pin") || "1234";
}

export default function PinLock({ onUnlock, onCancel }) {
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const handleChange = (index, value) => {
    // Take only the last numeric character typed
    const num = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = num;
    setDigits(newDigits);
    setError("");

    // If entered a number, auto-focus next box
    if (num && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // If all 4 digits are filled, auto-submit
    if (num && index === 3 && newDigits.every((d) => d !== "")) {
      const fullPin = newDigits.join("");
      const validPin = getAdminPin();
      if (fullPin === validPin) {
        sessionStorage.setItem("yatra_crm_auth", "true");
        onUnlock();
      } else {
        setError("Galat PIN! Kripya sahi PIN daalein.");
        setDigits(["", "", "", ""]);
        inputRefs[0].current?.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fullPin = digits.join("");
    const validPin = getAdminPin();
    if (fullPin === validPin) {
      sessionStorage.setItem("yatra_crm_auth", "true");
      onUnlock();
    } else {
      setError("Galat PIN! Kripya sahi PIN daalein.");
      setDigits(["", "", "", ""]);
      inputRefs[0].current?.focus();
    }
  };

  return (
    <div className="pin-screen-wrapper">
      <div className="pin-card-box">
        <div className="pin-brand-icon">ॐ</div>
        <h2>Yatra Saathi CRM</h2>
        <p>Admin dashboard mein login karne ke liye 4-digit security PIN darj karein</p>

        <form className="pin-form" onSubmit={handleSubmit}>
          <div className="pin-boxes-row">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={inputRefs[idx]}
                className={`pin-box-input ${digit ? "has-value" : ""}`}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                autoComplete="off"
                autoFocus={idx === 0}
              />
            ))}
          </div>

          {error && <div className="pin-error-badge">{error}</div>}

          <button type="submit" className="pin-unlock-btn">
            Unlock Dashboard 🔓
          </button>

          <button type="button" className="pin-back-link" onClick={onCancel}>
            ← Wapas Public Website Par Jayein
          </button>
        </form>

        <div className="pin-hint-tag">
          Default Admin PIN: <strong>1234</strong>
        </div>
      </div>
    </div>
  );
}
