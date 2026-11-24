import { useState } from "react";
import {
  reseedLocalLeads,
  clearAllLocalLeads,
  testSupabaseConnection,
  syncLocalLeadsToSupabase,
} from "../services/databaseService";
import { resetPackages } from "../services/packageService";
import "./SettingsTab.css";

export default function SettingsTab({
  leads = [],
  packagesList = [],
  onReloadData,
  showToast,
  onLockDashboard,
}) {
  // 1. PIN Management State
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPinText, setShowPinText] = useState(false);
  const activeSavedPin = localStorage.getItem("yatra_admin_pin") || "1234";

  // 2. Agency Profile State
  const [agencyProfile, setAgencyProfile] = useState(() => {
    try {
      const saved = localStorage.getItem("yatra_agency_info");
      return saved
        ? JSON.parse(saved)
        : {
            name: "Bhakti Yatra Tours & Travels",
            whatsapp: "919876543210",
            email: "darshan@bhaktiyatra.in",
            departureCity: "New Delhi / Haridwar",
            timings: "06:00 AM - 10:00 PM (All 7 Days)",
          };
    } catch {
      return {
        name: "Bhakti Yatra Tours & Travels",
        whatsapp: "919876543210",
        email: "darshan@bhaktiyatra.in",
        departureCity: "New Delhi / Haridwar",
        timings: "06:00 AM - 10:00 PM (All 7 Days)",
      };
    }
  });

  // 3. AI Persona & Bot Settings
  const [botConfig, setBotConfig] = useState(() => {
    try {
      const saved = localStorage.getItem("yatra_bot_settings");
      return saved
        ? JSON.parse(saved)
        : {
            tone: "bhakt",
            autoExtract: true,
            welcomeMsg:
              "Namaste! 🙏 Main 'Yatra Saathi' hoon — aapka Devotional Travel Guide.\n\nBharat ke kisi bhi teerth sthal (Ayodhya, Kedarnath, Vaishno Devi, Tirupati, Kashi, Vrindavan) ke darshan timings, packages, routes aur budget ke baare mein kuch bhi poochiye!",
          };
    } catch {
      return {
        tone: "bhakt",
        autoExtract: true,
        welcomeMsg:
          "Namaste! 🙏 Main 'Yatra Saathi' hoon — aapka Devotional Travel Guide.\n\nBharat ke kisi bhi teerth sthal (Ayodhya, Kedarnath, Vaishno Devi, Tirupati, Kashi, Vrindavan) ke darshan timings, packages, routes aur budget ke baare mein kuch bhi poochiye!",
      };
    }
  });

  // 4. Supabase Cloud Configuration State
  const [supabaseUrl, setSupabaseUrl] = useState(
    () => localStorage.getItem("yatra_supabase_url") || import.meta.env.VITE_SUPABASE_URL || ""
  );
  const [supabaseKey, setSupabaseKey] = useState(
    () => localStorage.getItem("yatra_supabase_key") || import.meta.env.VITE_SUPABASE_ANON_KEY || ""
  );
  const [showSqlGuide, setShowSqlGuide] = useState(false);
  const [dbTesting, setDbTesting] = useState(false);

  // Active section filter (All or specific tab)
  const [activeSection, setActiveSection] = useState("all");

  // Handler: Update Admin PIN
  const handleUpdatePin = (e) => {
    e.preventDefault();
    if (currentPin !== activeSavedPin) {
      showToast("❌ Incorrect current PIN! Please enter the valid security PIN.");
      return;
    }
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      showToast("⚠️ New PIN must be exactly 4 numeric digits!");
      return;
    }
    if (newPin !== confirmPin) {
      showToast("⚠️ New PIN and Confirm PIN do not match!");
      return;
    }

    localStorage.setItem("yatra_admin_pin", newPin);
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    showToast("✅ Admin access PIN updated successfully!");
  };

  // Handler: Save Agency Profile
  const handleSaveAgencyProfile = (e) => {
    e.preventDefault();
    localStorage.setItem("yatra_agency_info", JSON.stringify(agencyProfile));
    showToast("✅ Agency profile details saved successfully!");
  };

  // Handler: Save Bot Config
  const handleSaveBotConfig = (e) => {
    e.preventDefault();
    localStorage.setItem("yatra_bot_settings", JSON.stringify(botConfig));
    showToast("✅ AI Assistant preferences saved successfully!");
  };

  // Handler: Save Supabase Cloud Config
  const handleSaveSupabaseConfig = (e) => {
    e.preventDefault();
    if (supabaseUrl) localStorage.setItem("yatra_supabase_url", supabaseUrl.trim());
    if (supabaseKey) localStorage.setItem("yatra_supabase_key", supabaseKey.trim());
    showToast("✅ Cloud database parameters updated successfully!");
  };

  // Handler: Test DB Connection
  const handleTestDb = async () => {
    setDbTesting(true);
    const result = await testSupabaseConnection(supabaseUrl, supabaseKey);
    setDbTesting(false);
    if (result.success) {
      if (result.tableMissing) {
        setShowSqlGuide(true);
        showToast("⚠️ Connected! Please create the 'leads' table using the SQL guide.");
      } else {
        showToast("🟢 " + result.message);
      }
    } else {
      showToast("❌ " + result.message);
    }
  };

  // Handler: Sync Local Leads to Supabase
  const handleSyncToCloud = async () => {
    setDbTesting(true);
    const res = await syncLocalLeadsToSupabase();
    setDbTesting(false);
    if (res.success) {
      showToast(`☁️ Successfully synced ${res.count} leads to Supabase Cloud!`);
      if (onReloadData) onReloadData();
    } else {
      showToast("❌ Cloud sync failed: " + res.message);
    }
  };

  // Handler: Export Backup JSON
  const handleDownloadBackup = () => {
    const backupData = {
      app: "Yatra Saathi CRM",
      version: "2.0",
      exportedAt: new Date().toISOString(),
      leads,
      packages: packagesList,
      agency: agencyProfile,
      bot: botConfig,
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `yatra_saathi_crm_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("📥 CRM Data Backup downloaded successfully!");
  };

  // Handler: Import Backup JSON
  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result);
        if (parsed.leads && Array.isArray(parsed.leads)) {
          localStorage.setItem("yatra_crm_leads", JSON.stringify(parsed.leads));
        }
        if (parsed.packages && Array.isArray(parsed.packages)) {
          localStorage.setItem("yatra_crm_packages", JSON.stringify(parsed.packages));
        }
        if (parsed.agency) {
          localStorage.setItem("yatra_agency_info", JSON.stringify(parsed.agency));
          setAgencyProfile(parsed.agency);
        }
        if (parsed.bot) {
          localStorage.setItem("yatra_bot_settings", JSON.stringify(parsed.bot));
          setBotConfig(parsed.bot);
        }
        showToast("✅ Backup restored successfully!");
        if (onReloadData) onReloadData();
      } catch (err) {
        showToast("❌ Invalid JSON file! Please choose a valid backup file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Handler: Reseed Leads
  const handleReseedLeads = () => {
    if (window.confirm("Are you sure you want to restore the sample devotee leads?")) {
      reseedLocalLeads();
      showToast("🔄 Sample devotee leads restored successfully!");
      if (onReloadData) onReloadData();
    }
  };

  // Handler: Reset Packages
  const handleResetPackages = () => {
    if (window.confirm("Are you sure you want to restore the standard pilgrimage packages?")) {
      resetPackages();
      showToast("🔄 Standard pilgrimage packages restored successfully!");
      if (onReloadData) onReloadData();
    }
  };

  // Handler: Factory Reset
  const handleFactoryReset = () => {
    const confirmed = window.confirm(
      "⚠️ WARNING: This will permanently delete all cached devotee leads, custom tour packages, and reset the admin PIN to default (1234). Proceed with factory reset?"
    );
    if (confirmed) {
      clearAllLocalLeads();
      resetPackages();
      localStorage.removeItem("yatra_admin_pin");
      showToast("⚠️ All CRM data reset to factory defaults!");
      if (onReloadData) onReloadData();
    }
  };

  return (
    <div className="settings-page-wrapper">
      {/* Top Banner / Summary Header */}
      <div className="settings-header-banner">
        <div className="settings-header-info">
          <h2>⚙️ System & Agency Settings</h2>
          <p>Manage administrator security, agency profile, AI parameters, and cloud database synchronization.</p>
        </div>
        <div className="settings-header-actions">
          <button className="btn-lock-session" onClick={onLockDashboard} title="Lock Admin Session">
            🔒 Lock Dashboard
          </button>
        </div>
      </div>

      {/* Quick Navigation Filter Pills */}
      <div className="settings-nav-pills">
        <button
          className={`settings-nav-pill ${activeSection === "all" ? "active" : ""}`}
          onClick={() => setActiveSection("all")}
        >
          All Settings
        </button>
        <button
          className={`settings-nav-pill ${activeSection === "security" ? "active" : ""}`}
          onClick={() => setActiveSection("security")}
        >
          🔐 Admin Security PIN
        </button>
        <button
          className={`settings-nav-pill ${activeSection === "agency" ? "active" : ""}`}
          onClick={() => setActiveSection("agency")}
        >
          🏢 Agency Profile
        </button>
        <button
          className={`settings-nav-pill ${activeSection === "ai" ? "active" : ""}`}
          onClick={() => setActiveSection("ai")}
        >
          🤖 AI Persona Settings
        </button>
        <button
          className={`settings-nav-pill ${activeSection === "database" ? "active" : ""}`}
          onClick={() => setActiveSection("database")}
        >
          ☁️ Cloud Sync
        </button>
        <button
          className={`settings-nav-pill ${activeSection === "backup" ? "active" : ""}`}
          onClick={() => setActiveSection("backup")}
        >
          💾 Backup & Restore
        </button>
      </div>

      {/* Grid Layout of Settings Cards */}
      <div className="settings-grid">
        {/* ================= CARD 1: SECURITY & ADMIN PIN ================= */}
        {(activeSection === "all" || activeSection === "security") && (
          <div className="settings-card-pro">
            <div className="settings-card-pro-header">
              <div className="settings-card-pro-title">
                <span className="card-pro-icon">🔐</span>
                <div>
                  <h4>Admin Security & Access PIN</h4>
                  <p>Update administrator dashboard login PIN (Default: 1234)</p>
                </div>
              </div>
              <span className={`status-badge ${activeSavedPin === "1234" ? "badge-warning" : "badge-success"}`}>
                {activeSavedPin === "1234" ? "⚠️ Default PIN Active" : "🛡️ Custom PIN Protected"}
              </span>
            </div>

            <form onSubmit={handleUpdatePin} className="settings-card-body">
              <div className="settings-form-row">
                <div className="form-group-pro">
                  <label>Current PIN *</label>
                  <input
                    type={showPinText ? "text" : "password"}
                    maxLength={4}
                    placeholder="Enter current PIN"
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
                    required
                    className="input-pro"
                  />
                </div>
                <div className="form-group-pro">
                  <label>New 4-Digit PIN *</label>
                  <input
                    type={showPinText ? "text" : "password"}
                    maxLength={4}
                    placeholder="e.g. 5678"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                    required
                    className="input-pro"
                  />
                </div>
                <div className="form-group-pro">
                  <label>Confirm New PIN *</label>
                  <input
                    type={showPinText ? "text" : "password"}
                    maxLength={4}
                    placeholder="Confirm new PIN"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                    required
                    className="input-pro"
                  />
                </div>
              </div>

              <div className="settings-pin-helper">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={showPinText}
                    onChange={(e) => setShowPinText(e.target.checked)}
                  />
                  <span>Show PIN digits</span>
                </label>
                <span className="helper-hint">Only numeric characters allowed (0-9)</span>
              </div>

              <div className="settings-card-footer">
                <button type="submit" className="btn-pro-primary">
                  💾 Update Security PIN
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= CARD 2: AGENCY PROFILE ================= */}
        {(activeSection === "all" || activeSection === "agency") && (
          <div className="settings-card-pro">
            <div className="settings-card-pro-header">
              <div className="settings-card-pro-title">
                <span className="card-pro-icon">🏢</span>
                <div>
                  <h4>Agency Profile & Devotee Helpdesk</h4>
                  <p>In-app branding, official WhatsApp support, and helpline details</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveAgencyProfile} className="settings-card-body">
              <div className="settings-grid-2col">
                <div className="form-group-pro">
                  <label>Agency / Organization Name</label>
                  <input
                    type="text"
                    value={agencyProfile.name}
                    onChange={(e) => setAgencyProfile({ ...agencyProfile, name: e.target.value })}
                    className="input-pro"
                    placeholder="e.g. Bhakti Yatra Tours & Travels"
                    required
                  />
                </div>
                <div className="form-group-pro">
                  <label>Official WhatsApp Number (With Country Code)</label>
                  <input
                    type="tel"
                    value={agencyProfile.whatsapp}
                    onChange={(e) => setAgencyProfile({ ...agencyProfile, whatsapp: e.target.value.replace(/[^\d+]/g, "") })}
                    className="input-pro"
                    placeholder="e.g. 919876543210"
                    required
                  />
                </div>
              </div>

              <div className="settings-grid-2col" style={{ marginTop: "12px" }}>
                <div className="form-group-pro">
                  <label>Official Support Email</label>
                  <input
                    type="email"
                    value={agencyProfile.email}
                    onChange={(e) => setAgencyProfile({ ...agencyProfile, email: e.target.value })}
                    className="input-pro"
                    placeholder="darshan@bhaktiyatra.in"
                  />
                </div>
                <div className="form-group-pro">
                  <label>Default Departure Hub / City</label>
                  <input
                    type="text"
                    value={agencyProfile.departureCity}
                    onChange={(e) => setAgencyProfile({ ...agencyProfile, departureCity: e.target.value })}
                    className="input-pro"
                    placeholder="e.g. New Delhi / Haridwar"
                  />
                </div>
              </div>

              <div className="form-group-pro" style={{ marginTop: "12px" }}>
                <label>Devotee Helpline Hours</label>
                <input
                  type="text"
                  value={agencyProfile.timings}
                  onChange={(e) => setAgencyProfile({ ...agencyProfile, timings: e.target.value })}
                  className="input-pro"
                  placeholder="06:00 AM - 10:00 PM (All 7 Days)"
                />
              </div>

              <div className="settings-card-footer">
                <button type="submit" className="btn-pro-primary">
                  💾 Save Agency Profile
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= CARD 3: AI YATRA SAATHI SETTINGS ================= */}
        {(activeSection === "all" || activeSection === "ai") && (
          <div className="settings-card-pro">
            <div className="settings-card-pro-header">
              <div className="settings-card-pro-title">
                <span className="card-pro-icon">🤖</span>
                <div>
                  <h4>AI Assistant & Persona Settings</h4>
                  <p>Configure model engine, conversation tone, and automated lead capture</p>
                </div>
              </div>
              <span className="status-badge badge-model">⚡ Gemini 2.5 Flash Active</span>
            </div>

            <form onSubmit={handleSaveBotConfig} className="settings-card-body">
              <div className="settings-grid-2col">
                <div className="form-group-pro">
                  <label>Devotional Tone / Persona</label>
                  <select
                    className="input-pro"
                    value={botConfig.tone}
                    onChange={(e) => setBotConfig({ ...botConfig, tone: e.target.value })}
                  >
                    <option value="bhakt">🙏 Devotional & Warm (Respectful traditional greeting, Jai Shri Ram)</option>
                    <option value="advisor">🏛️ Professional Pilgrimage Consultant (Structured & itinerary-focused)</option>
                    <option value="concise">⚡ Fast & Concise (Direct package timings & budget)</option>
                  </select>
                </div>
                <div className="form-group-pro">
                  <label>Real-Time Lead Extraction Engine</label>
                  <div className="feature-toggle-card">
                    <input
                      type="checkbox"
                      id="autoExtractCheck"
                      checked={botConfig.autoExtract}
                      onChange={(e) => setBotConfig({ ...botConfig, autoExtract: e.target.checked })}
                    />
                    <label htmlFor="autoExtractCheck" style={{ margin: 0, cursor: "pointer" }}>
                      <strong>Auto-Extract Leads</strong>
                      <small>Automatically captures Name, Phone, Destination, and Travellers from chat.</small>
                    </label>
                  </div>
                </div>
              </div>

              <div className="form-group-pro" style={{ marginTop: "12px" }}>
                <label>Bot Initial Welcome Greeting</label>
                <textarea
                  rows={3}
                  value={botConfig.welcomeMsg}
                  onChange={(e) => setBotConfig({ ...botConfig, welcomeMsg: e.target.value })}
                  className="input-pro textarea-pro"
                  placeholder="Initial greeting message presented to devotees when opening the chatbot..."
                />
              </div>

              <div className="settings-card-footer">
                <button type="submit" className="btn-pro-primary">
                  💾 Save AI Preferences
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= CARD 4: SUPABASE CLOUD SYNC ================= */}
        {(activeSection === "all" || activeSection === "database") && (
          <div className="settings-card-pro">
            <div className="settings-card-pro-header">
              <div className="settings-card-pro-title">
                <span className="card-pro-icon">☁️</span>
                <div>
                  <h4>Database & Cloud Synchronization</h4>
                  <p>Enterprise Supabase PostgreSQL cloud sync & resilient local storage status</p>
                </div>
              </div>
              <span className={`status-badge ${supabaseUrl ? "badge-success" : "badge-neutral"}`}>
                {supabaseUrl ? "🟢 Cloud DB Configured" : "🟡 Local Browser Mode"}
              </span>
            </div>

            <form onSubmit={handleSaveSupabaseConfig} className="settings-card-body">
              <div className="settings-form-row">
                <div className="form-group-pro" style={{ flex: 1.2 }}>
                  <label>Supabase Project URL</label>
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="input-pro"
                  />
                </div>
                <div className="form-group-pro" style={{ flex: 1.2 }}>
                  <label>Supabase Anon Key</label>
                  <input
                    type="password"
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    className="input-pro"
                  />
                </div>
              </div>

              <div className="db-status-banner">
                <div className="db-status-left">
                  <div className="db-dot-live" />
                  <div>
                    <strong>Storage Engine:</strong>{" "}
                    {supabaseUrl ? "Dual Sync (Supabase PostgreSQL + Local Cache)" : "Local Storage Mode (High-Speed & Resilient)"}
                    <div style={{ fontSize: "0.75rem", color: "var(--crm-text-muted)" }}>
                      Total Cached Leads: <strong>{leads.length}</strong> · Active Pilgrimage Packages:{" "}
                      <strong>{packagesList.length}</strong>
                    </div>
                  </div>
                </div>
                <div className="db-status-right">
                  <button
                    type="button"
                    className="btn-pro-outline"
                    onClick={handleTestDb}
                    disabled={dbTesting}
                  >
                    {dbTesting ? "Testing..." : "⚡ Test Connection"}
                  </button>
                  {supabaseUrl && (
                    <button
                      type="button"
                      className="btn-pro-outline"
                      onClick={handleSyncToCloud}
                      disabled={dbTesting}
                      title="Sync all current leads to Supabase"
                    >
                      ☁️ Sync Leads to Cloud
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-pro-outline"
                    onClick={() => setShowSqlGuide(!showSqlGuide)}
                  >
                    {showSqlGuide ? "Hide SQL Setup" : "📋 View SQL Setup"}
                  </button>
                </div>
              </div>

              {showSqlGuide && (
                <div className="sql-guide-box">
                  <div className="sql-guide-title">
                    <span>SQL Table Schema (Run inside Supabase SQL Editor):</span>
                  </div>
                  <pre className="sql-code-block">
{`CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  phone TEXT,
  destination TEXT,
  travellers TEXT,
  preferred_date TEXT,
  status TEXT DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`}
                  </pre>
                </div>
              )}

              <div className="settings-card-footer">
                <button type="submit" className="btn-pro-primary">
                  💾 Save Cloud Config
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= CARD 5: DATA MANAGEMENT & BACKUP ================= */}
        {(activeSection === "all" || activeSection === "backup") && (
          <div className="settings-card-pro">
            <div className="settings-card-pro-header">
              <div className="settings-card-pro-title">
                <span className="card-pro-icon">💾</span>
                <div>
                  <h4>Data Management, Backup & Maintenance</h4>
                  <p>Download full JSON backup, restore previous data, or reset system defaults</p>
                </div>
              </div>
            </div>

            <div className="settings-card-body">
              <div className="backup-actions-grid">
                {/* 1. Download Backup */}
                <div className="backup-action-card">
                  <div className="backup-icon">📥</div>
                  <div className="backup-info">
                    <h5>Download Full Backup</h5>
                    <p>Export all devotee leads, tour packages, and settings to a JSON backup file.</p>
                  </div>
                  <button className="btn-pro-primary" onClick={handleDownloadBackup}>
                    Download .JSON
                  </button>
                </div>

                {/* 2. Restore Backup */}
                <div className="backup-action-card">
                  <div className="backup-icon">📤</div>
                  <div className="backup-info">
                    <h5>Restore from Backup</h5>
                    <p>Recover leads and packages from a previously exported JSON backup file.</p>
                  </div>
                  <label className="btn-pro-outline btn-file-label">
                    <span>Upload .JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportBackup}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>

                {/* 3. Re-seed Sample Leads */}
                <div className="backup-action-card">
                  <div className="backup-icon">🔄</div>
                  <div className="backup-info">
                    <h5>Re-seed Sample Leads</h5>
                    <p>Reload 3 realistic sample devotee leads for testing and demo purposes.</p>
                  </div>
                  <button className="btn-pro-outline" onClick={handleReseedLeads}>
                    Restore Sample Leads
                  </button>
                </div>

                {/* 4. Reset Packages */}
                <div className="backup-action-card">
                  <div className="backup-icon">📦</div>
                  <div className="backup-info">
                    <h5>Reset Pilgrimage Packages</h5>
                    <p>Reload the original 6 standard pilgrimage packages.</p>
                  </div>
                  <button className="btn-pro-outline" onClick={handleResetPackages}>
                    Reset Packages
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="danger-zone-box">
                <div className="danger-zone-left">
                  <span className="danger-icon">⚠️</span>
                  <div>
                    <strong>Danger Zone: Factory Reset</strong>
                    <p>All cached leads, custom packages, and settings will be wiped, and the PIN will reset to default (1234).</p>
                  </div>
                </div>
                <button className="btn-danger-solid" onClick={handleFactoryReset}>
                  Factory Reset CRM
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
