import { useEffect, useState, useCallback, useMemo } from "react";
import {
  fetchLeads,
  createLead,
  updateLead,
  deleteLead,
  getLeadStats,
} from "../services/databaseService";
import "./CrmDashboard.css";

const STATUS_CONFIG = {
  new: { label: "New Lead", pillClass: "new", dotColor: "#F59E0B" },
  contacted: { label: "Contacted", pillClass: "contacted", dotColor: "#3B82F6" },
  booked: { label: "Booked", pillClass: "booked", dotColor: "#10B981" },
  cancelled: { label: "Cancelled", pillClass: "cancelled", dotColor: "#EF4444" },
};

const DEFAULT_TOURS = [
  { id: "ayodhya", name: "Ayodhya Dham", hindi: "Ram Janmabhoomi Darshan", days: "2 Din · 1 Raat", price: "₹3,999", icon: "ॐ" },
  { id: "kedarnath", name: "Kedarnath & Badrinath", hindi: "Do Dham Himalayan Yatra", days: "6 Din · 5 Raat", price: "₹14,999", icon: "🏔️" },
  { id: "vaishno", name: "Mata Vaishno Devi", hindi: "Katra Dham Yatra", days: "4 Din · 3 Raat", price: "₹8,499", icon: "🌸" },
  { id: "chardham", name: "Complete Char Dham", hindi: "Yamunotri, Gangotri, Kedar, Badri", days: "10 Din · 9 Raat", price: "₹24,999", icon: "✨" },
  { id: "tirupati", name: "Tirupati Balaji", hindi: "Venkateswara Swamy Darshan", days: "3 Din · 2 Raat", price: "₹9,999", icon: "🚩" },
  { id: "kashi", name: "Kashi Vishwanath & Ganga Aarti", hindi: "Varanasi Spiritual Tour", days: "3 Din · 2 Raat", price: "₹6,999", icon: "🔱" },
];

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("hi-IN", { day: "numeric", month: "short", year: "numeric" }) +
    " • " +
    d.toLocaleTimeString("hi-IN", { hour: "2-digit", minute: "2-digit" })
  );
}

// Download CSV cleanly
function downloadLeadsCsv(leads) {
  if (!leads.length) return false;
  const headers = ["ID", "Name", "Phone", "Destination", "Travellers", "Date", "Status", "Notes", "Created At"];
  const rows = leads.map((l) => [
    `"${l.id}"`,
    `"${l.name || ""}"`,
    `"${l.phone || ""}"`,
    `"${l.destination || ""}"`,
    `"${l.travellers || ""}"`,
    `"${l.preferred_date || ""}"`,
    `"${l.status || ""}"`,
    `"${(l.notes || "").replace(/"/g, '""')}"`,
    `"${l.created_at || ""}"`,
  ]);

  const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
  const link = document.createElement("a");
  link.href = encodeURI(csv);
  link.download = `yatra-saathi-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}

export default function CrmDashboard({ onSwitchToChat }) {
  // Navigation State
  const [activeTab, setActiveTab] = useState("leads"); // "overview" | "leads" | "pipeline" | "tours" | "settings"

  // Data State
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDest, setFilterDest] = useState("all");
  const [loading, setLoading] = useState(true);

  // Inspector Drawer State
  const [inspectingLead, setInspectingLead] = useState(null);

  // Modals & Popups
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWaModal, setShowWaModal] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Toast Notification State
  const [toasts, setToasts] = useState([]);
  const showToast = (message) => {
    const id = Date.now();
    setToasts((curr) => [...curr, { id, message }]);
    setTimeout(() => {
      setToasts((curr) => curr.filter((t) => t.id !== id));
    }, 3000);
  };

  // Form State for Manual Lead
  const [addForm, setAddForm] = useState({
    name: "",
    phone: "",
    destination: "Ayodhya",
    travellers: "2",
    preferred_date: "",
    status: "new",
    notes: "",
  });

  // Settings State
  const [currentPin, setCurrentPin] = useState("1234");
  const [newPin, setNewPin] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    const [leadsData, statsData] = await Promise.all([fetchLeads(), getLeadStats()]);
    setLeads(leadsData);
    setStats(statsData);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 12000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Lead Operations
  const handleUpdateStatus = async (id, newStatus) => {
    await updateLead(id, { status: newStatus });
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l)));
    if (inspectingLead?.id === id) {
      setInspectingLead((prev) => ({ ...prev, status: newStatus }));
    }
    showToast(`Status updated to ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
    getLeadStats().then(setStats);
  };

  const handleUpdateNotes = async (id, notes) => {
    await updateLead(id, { notes });
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, notes } : l)));
    if (inspectingLead?.id === id) {
      setInspectingLead((prev) => ({ ...prev, notes }));
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    await deleteLead(confirmDeleteId);
    if (inspectingLead?.id === confirmDeleteId) setInspectingLead(null);
    setConfirmDeleteId(null);
    showToast("Lead successfully deleted");
    loadData();
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.phone.trim()) {
      return showToast("⚠️ Naam aur Phone zaroori hain!");
    }
    await createLead(addForm);
    setShowAddModal(false);
    setAddForm({
      name: "",
      phone: "",
      destination: "Ayodhya",
      travellers: "2",
      preferred_date: "",
      status: "new",
      notes: "",
    });
    showToast("✅ Nayi lead successfully create ho gayi!");
    loadData();
  };

  // WhatsApp Sender
  const sendWhatsApp = (lead, template) => {
    const dest = lead.destination || "Teerth Yatra";
    let text = "";
    if (template === "welcome") {
      text = `Namaste ${lead.name || ""} ji 🙏\nAapne Yatra Saathi par *${dest}* yatra ke liye enquiry ki thi.\nHumari team aapki yatra plan karne mein kaise sahayata karein?`;
    } else if (template === "quote") {
      text = `Jai Shri Ram ${lead.name || ""} ji 🙏\n*${dest}* yatra ke best packages humare paas uplabdh hain.\n• Transport, Stay aur Darshan Guidance shamil\nKya aap preferred dates confirm kar sakte hain?`;
    } else if (template === "booked") {
      text = `Namaste ${lead.name || ""} ji 🙏\nAapki *${dest}* yatra booking confirm karne ke liye itinerary taiyaar hai. Kripya booking formalities poori karein. Dhanyavaad!`;
    }

    const phone = lead.phone ? `91${lead.phone.replace(/\D/g, "").slice(-10)}` : "";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
    setShowWaModal(null);
    if (lead.status === "new") {
      handleUpdateStatus(lead.id, "contacted");
    }
    showToast("📱 WhatsApp khul raha hai...");
  };

  // Unique destinations for filter
  const uniqueDestinations = useMemo(() => {
    const set = new Set();
    leads.forEach((l) => l.destination && set.add(l.destination.toLowerCase()));
    return Array.from(set);
  }, [leads]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (filterStatus !== "all" && lead.status !== filterStatus) return false;
      if (filterDest !== "all" && (lead.destination || "").toLowerCase() !== filterDest.toLowerCase()) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          (lead.name || "").toLowerCase().includes(q) ||
          (lead.phone || "").includes(q) ||
          (lead.destination || "").toLowerCase().includes(q) ||
          (lead.notes || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [leads, filterStatus, filterDest, search]);

  return (
    <div className="crm-app-shell">
      {/* ================= LEFT SAAS SIDEBAR ================= */}
      <aside className="crm-sidebar">
        <div className="crm-sidebar-brand">
          <div className="crm-brand-icon">ॐ</div>
          <div className="crm-brand-title">
            <strong>Yatra Saathi CRM</strong>
            <span>Pilgrimage Business Suite</span>
          </div>
        </div>

        <nav className="crm-nav-list">
          <button
            className={`crm-nav-item ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <div className="crm-nav-left">
              <span>📊</span> Overview
            </div>
          </button>

          <button
            className={`crm-nav-item ${activeTab === "leads" ? "active" : ""}`}
            onClick={() => setActiveTab("leads")}
          >
            <div className="crm-nav-left">
              <span>👥</span> All Leads
            </div>
            <span className="crm-nav-badge">{leads.length}</span>
          </button>

          <button
            className={`crm-nav-item ${activeTab === "pipeline" ? "active" : ""}`}
            onClick={() => setActiveTab("pipeline")}
          >
            <div className="crm-nav-left">
              <span>📌</span> Pipeline Kanban
            </div>
            {stats.new > 0 && <span className="crm-nav-badge">{stats.new} new</span>}
          </button>

          <button
            className={`crm-nav-item ${activeTab === "tours" ? "active" : ""}`}
            onClick={() => setActiveTab("tours")}
          >
            <div className="crm-nav-left">
              <span>📦</span> Yatra Packages
            </div>
          </button>

          <button
            className={`crm-nav-item ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            <div className="crm-nav-left">
              <span>⚙️</span> Settings & PIN
            </div>
          </button>
        </nav>

        <div className="crm-sidebar-footer">
          <div className="crm-admin-pill">
            <div className="crm-admin-avatar">AD</div>
            <div className="crm-admin-meta">
              <strong>Admin Organiser</strong>
              <span>● Operational</span>
            </div>
          </div>
          <button
            className="crm-logout-btn"
            onClick={() => {
              sessionStorage.removeItem("yatra_crm_auth");
              onSwitchToChat();
            }}
            title="Lock Panel & Logout"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* ================= MAIN VIEWPORT ================= */}
      <div className="crm-main-viewport">
        {/* TOPBAR */}
        <header className="crm-topbar">
          <div className="crm-topbar-title">
            <h1>
              {activeTab === "overview" && "Executive Overview"}
              {activeTab === "leads" && "Devotee Enquiries & Leads"}
              {activeTab === "pipeline" && "Yatra Lead Pipeline"}
              {activeTab === "tours" && "Pilgrimage Packages Catalog"}
              {activeTab === "settings" && "System & Security Settings"}
            </h1>
          </div>

          <div className="crm-topbar-actions">
            <button className="btn-secondary" onClick={() => {
              const ok = downloadLeadsCsv(leads);
              if (ok) showToast("📥 Leads CSV download ho gaya!");
            }}>
              📥 Export CSV
            </button>
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
              + Nayi Lead
            </button>
            <button className="btn-secondary" onClick={onSwitchToChat}>
              💬 Public Chatbot
            </button>
          </div>
        </header>

        {/* SCROLLABLE VIEW BODY */}
        <main className="crm-view-body">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <>
              <div className="crm-metrics-grid">
                <div className="metric-card total">
                  <div className="metric-card-header">
                    <span className="metric-title">Total Enquiries</span>
                    <div className="metric-icon-wrap">👥</div>
                  </div>
                  <span className="metric-value">{stats.total || 0}</span>
                  <span className="metric-footer">Lifetime captured leads</span>
                </div>

                <div className="metric-card new">
                  <div className="metric-card-header">
                    <span className="metric-title">New Enquiries</span>
                    <div className="metric-icon-wrap">🟡</div>
                  </div>
                  <span className="metric-value">{stats.new || 0}</span>
                  <span className="metric-footer">Requires initial call/WhatsApp</span>
                </div>

                <div className="metric-card contacted">
                  <div className="metric-card-header">
                    <span className="metric-title">In Discussion</span>
                    <div className="metric-icon-wrap">🔵</div>
                  </div>
                  <span className="metric-value">{stats.contacted || 0}</span>
                  <span className="metric-footer">Itinerary shared</span>
                </div>

                <div className="metric-card booked">
                  <div className="metric-card-header">
                    <span className="metric-title">Confirmed Yatras</span>
                    <div className="metric-icon-wrap">🟢</div>
                  </div>
                  <span className="metric-value">{stats.booked || 0}</span>
                  <span className="metric-footer">Advance confirmed</span>
                </div>

                <div className="metric-card top">
                  <div className="metric-card-header">
                    <span className="metric-title">Most Demanded</span>
                    <div className="metric-icon-wrap">🔥</div>
                  </div>
                  <span className="metric-value">{stats.topDestination || "—"}</span>
                  <span className="metric-footer">{stats.topDestCount ? `${stats.topDestCount} devotee enquiries` : "Tracking active"}</span>
                </div>
              </div>

              {/* RECENT LEADS QUICK TABLE */}
              <div className="crm-table-card">
                <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--crm-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: "0.95rem" }}>Taza Enquiries (Recent Leads)</strong>
                  <button className="btn-secondary" style={{ padding: "5px 12px", fontSize: "0.78rem" }} onClick={() => setActiveTab("leads")}>
                    Sabhi Leads Dekhein ➔
                  </button>
                </div>
                <table className="pro-table">
                  <thead>
                    <tr>
                      <th>Yatri Naam</th>
                      <th>Phone</th>
                      <th>Destination</th>
                      <th>Yatri</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.slice(0, 5).map((l) => (
                      <tr key={l.id}>
                        <td><strong>{l.name || "Devotee"}</strong></td>
                        <td><span className="phone-tag">{l.phone || "—"}</span></td>
                        <td><span className="dest-pill">{l.destination || "Yatra"}</span></td>
                        <td>{l.travellers || "—"}</td>
                        <td>
                          <span className={`status-pill ${l.status || "new"}`}>
                            {STATUS_CONFIG[l.status || "new"]?.label}
                          </span>
                        </td>
                        <td>
                          <button className="btn-whatsapp" onClick={() => setShowWaModal(l)}>
                            📱 WhatsApp
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* TAB 2: ALL LEADS TABLE */}
          {activeTab === "leads" && (
            <>
              {/* TOOLBAR */}
              <div className="crm-data-toolbar">
                <div className="toolbar-search-box">
                  <span className="toolbar-search-icon">🔍</span>
                  <input
                    className="toolbar-search-input"
                    type="text"
                    placeholder="Search by naam, phone, destination, remarks..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="toolbar-filters">
                  <select
                    className="toolbar-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All Statuses ({leads.length})</option>
                    <option value="new">🟡 New ({stats.new || 0})</option>
                    <option value="contacted">🔵 Contacted ({stats.contacted || 0})</option>
                    <option value="booked">🟢 Booked ({stats.booked || 0})</option>
                    <option value="cancelled">🔴 Cancelled ({stats.cancelled || 0})</option>
                  </select>

                  <select
                    className="toolbar-select"
                    value={filterDest}
                    onChange={(e) => setFilterDest(e.target.value)}
                  >
                    <option value="all">All Destinations</option>
                    {uniqueDestinations.map((d) => (
                      <option key={d} value={d}>{d.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* DATA TABLE */}
              <div className="crm-table-card">
                <table className="pro-table">
                  <thead>
                    <tr>
                      <th>Yatri Details</th>
                      <th>Contact Info</th>
                      <th>Dham / Destination</th>
                      <th>Yatri & Date</th>
                      <th>Pipeline Status</th>
                      <th>Internal Notes</th>
                      <th>Enquiry Timestamp</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id}>
                        <td>
                          <div className="lead-cell-name" onClick={() => setInspectingLead(lead)}>
                            <strong>{lead.name || "Unnamed Devotee"}</strong>
                            <span className="lead-cell-sub">ID: #{lead.id.slice(0, 6)}</span>
                          </div>
                        </td>
                        <td>
                          <span className="phone-tag">{lead.phone || "—"}</span>
                        </td>
                        <td>
                          <span className="dest-pill">{lead.destination || "Teerth Yatra"}</span>
                        </td>
                        <td>
                          <div style={{ fontSize: "0.82rem" }}>
                            <strong>{lead.travellers ? `${lead.travellers} yatri` : "—"}</strong>
                            <div style={{ color: "var(--crm-text-muted)", fontSize: "0.75rem" }}>
                              {lead.preferred_date || "Open dates"}
                            </div>
                          </div>
                        </td>
                        <td>
                          <select
                            className={`status-pill ${lead.status || "new"}`}
                            value={lead.status || "new"}
                            onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                          >
                            <option value="new">🟡 New</option>
                            <option value="contacted">🔵 Contacted</option>
                            <option value="booked">🟢 Booked</option>
                            <option value="cancelled">🔴 Cancelled</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="notes-input"
                            value={lead.notes || ""}
                            placeholder="Add remark..."
                            onChange={(e) => handleUpdateNotes(lead.id, e.target.value)}
                          />
                        </td>
                        <td style={{ fontSize: "0.76rem", color: "var(--crm-text-muted)" }}>
                          {formatDate(lead.created_at)}
                        </td>
                        <td>
                          <div className="table-actions">
                            {lead.phone && (
                              <button
                                className="btn-whatsapp"
                                onClick={() => setShowWaModal(lead)}
                                title="Send WhatsApp Message"
                              >
                                📱 WA
                              </button>
                            )}
                            <button
                              className="btn-icon-soft"
                              onClick={() => setInspectingLead(lead)}
                              title="Inspect Full Details"
                            >
                              🔍
                            </button>
                            <button
                              className="btn-icon-soft danger"
                              onClick={() => setConfirmDeleteId(lead.id)}
                              title="Delete Lead"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredLeads.length === 0 && (
                      <tr>
                        <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "var(--crm-text-muted)" }}>
                          🕉️ Koi lead nahi mili. Nayi lead add karne ke liye "+ Nayi Lead" dabayein.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* TAB 3: PIPELINE KANBAN */}
          {activeTab === "pipeline" && (
            <div className="crm-kanban">
              {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                const colLeads = leads.filter((l) => (l.status || "new") === key);
                return (
                  <div key={key} className="kanban-col">
                    <div className={`kanban-col-header ${key}`}>
                      <span>{config.label}</span>
                      <span className="kanban-badge">{colLeads.length}</span>
                    </div>

                    <div className="kanban-cards-list">
                      {colLeads.map((lead) => (
                        <div key={lead.id} className="kanban-card" onClick={() => setInspectingLead(lead)}>
                          <div className="kanban-card-top">
                            <strong>{lead.name || "Unnamed"}</strong>
                            <span className="dest-pill">{lead.destination || "Yatra"}</span>
                          </div>
                          <div className="kanban-card-phone">📞 {lead.phone || "No phone"}</div>
                          <div className="kanban-card-details">
                            <span>👥 {lead.travellers || "—"}</span>
                            <span>•</span>
                            <span>📅 {lead.preferred_date || "Open dates"}</span>
                          </div>
                          {lead.notes && (
                            <div style={{ fontSize: "0.75rem", color: "var(--crm-text-muted)", fontStyle: "italic" }}>
                              "{lead.notes}"
                            </div>
                          )}
                          <div className="kanban-card-actions" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="btn-whatsapp"
                              style={{ padding: "4px 8px", fontSize: "0.72rem" }}
                              onClick={() => setShowWaModal(lead)}
                            >
                              📱 WA
                            </button>
                            <select
                              className={`status-pill ${lead.status || "new"}`}
                              style={{ fontSize: "0.74rem", padding: "2px 6px" }}
                              value={lead.status || "new"}
                              onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                            >
                              <option value="new">➔ New</option>
                              <option value="contacted">➔ Contacted</option>
                              <option value="booked">➔ Booked</option>
                              <option value="cancelled">➔ Cancelled</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: YATRA PACKAGES CATALOG */}
          {activeTab === "tours" && (
            <div className="tours-grid">
              {DEFAULT_TOURS.map((tour) => (
                <div key={tour.id} className="tour-admin-card">
                  <div className="tour-card-header">
                    <div className="tour-icon">{tour.icon}</div>
                    <span className="dest-pill">Active Package</span>
                  </div>
                  <div>
                    <h3>{tour.name}</h3>
                    <p style={{ marginTop: "4px" }}>{tour.hindi}</p>
                    <p style={{ color: "var(--crm-text-muted)", fontSize: "0.78rem", marginTop: "2px" }}>
                      ⏱️ {tour.days}
                    </p>
                  </div>
                  <div className="tour-card-price">{tour.price} <small style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--crm-text-muted)" }}>/ vyakti se</small></div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: SETTINGS */}
          {activeTab === "settings" && (
            <div className="settings-container">
              <div className="settings-card">
                <h3>🔒 Admin Security PIN</h3>
                <p>CRM Dashboard unlock karne ke liye 4-digit PIN yahan badal sakte hain:</p>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="Enter new 4-digit PIN"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                    style={{ padding: "10px 14px", border: "1px solid var(--crm-border)", borderRadius: "8px", width: "220px", fontSize: "1.1rem" }}
                  />
                  <button
                    className="btn-primary"
                    onClick={() => {
                      if (newPin.length !== 4) return showToast("⚠️ PIN 4 digits ka hona chahiye!");
                      setCurrentPin(newPin);
                      setNewPin("");
                      showToast("✅ Admin PIN successfully updated!");
                    }}
                  >
                    Update PIN
                  </button>
                </div>
              </div>

              <div className="settings-card">
                <h3>💾 Database & Cloud Sync Status</h3>
                <p>Yatra Saathi CRM data storage configuration:</p>
                <div style={{ background: "#FAF8F6", padding: "14px", borderRadius: "8px", fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div><strong>Storage Engine:</strong> Local Browser Storage (Active & Resilient)</div>
                  <div><strong>Supabase Cloud:</strong> Configurable via <code>.env</code> (VITE_SUPABASE_URL)</div>
                  <div><strong>Total Cached Records:</strong> {leads.length} devotee leads</div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ================= SLIDE-OVER RIGHT DRAWER (INSPECTOR) ================= */}
      {inspectingLead && (
        <div className="drawer-backdrop" onClick={() => setInspectingLead(null)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="drawer-title">
                <strong>{inspectingLead.name || "Devotee"}</strong>
                <span>Lead ID: #{inspectingLead.id}</span>
              </div>
              <button className="btn-icon-soft" onClick={() => setInspectingLead(null)}>✕</button>
            </div>

            <div className="drawer-body">
              <div className="drawer-section">
                <span className="drawer-section-title">Contact & Travel Overview</span>
                <div className="drawer-info-grid">
                  <div className="drawer-info-item">
                    <label>WhatsApp / Phone</label>
                    <strong>{inspectingLead.phone || "—"}</strong>
                  </div>
                  <div className="drawer-info-item">
                    <label>Destination</label>
                    <strong style={{ textTransform: "capitalize" }}>{inspectingLead.destination || "—"}</strong>
                  </div>
                  <div className="drawer-info-item">
                    <label>Yatri Count</label>
                    <strong>{inspectingLead.travellers || "—"}</strong>
                  </div>
                  <div className="drawer-info-item">
                    <label>Travel Dates</label>
                    <strong>{inspectingLead.preferred_date || "Open"}</strong>
                  </div>
                </div>
              </div>

              <div className="drawer-section">
                <span className="drawer-section-title">Pipeline Stage</span>
                <select
                  className={`status-pill ${inspectingLead.status || "new"}`}
                  style={{ width: "fit-content", fontSize: "0.88rem", padding: "6px 14px" }}
                  value={inspectingLead.status || "new"}
                  onChange={(e) => handleUpdateStatus(inspectingLead.id, e.target.value)}
                >
                  <option value="new">🟡 New Lead</option>
                  <option value="contacted">🔵 In Talks / Contacted</option>
                  <option value="booked">🟢 Confirmed Booked</option>
                  <option value="cancelled">🔴 Cancelled</option>
                </select>
              </div>

              <div className="drawer-section">
                <span className="drawer-section-title">Internal Notes & Remarks</span>
                <textarea
                  rows="4"
                  className="crm-form-textarea"
                  placeholder="Yatri ki special requirements, payment details ya discussions yahan note karein..."
                  value={inspectingLead.notes || ""}
                  onChange={(e) => handleUpdateNotes(inspectingLead.id, e.target.value)}
                />
              </div>

              <div className="drawer-section">
                <span className="drawer-section-title">Timeline & Timestamp</span>
                <div style={{ fontSize: "0.8rem", color: "var(--crm-text-muted)" }}>
                  Captured On: {formatDate(inspectingLead.created_at)}
                </div>
              </div>
            </div>

            <div className="drawer-footer">
              <button
                className="btn-icon-soft danger"
                onClick={() => {
                  setConfirmDeleteId(inspectingLead.id);
                }}
              >
                Delete Lead
              </button>
              {inspectingLead.phone && (
                <button
                  className="btn-whatsapp"
                  onClick={() => setShowWaModal(inspectingLead)}
                >
                  📱 Send WhatsApp Message
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: MANUAL LEAD CREATION ================= */}
      {showAddModal && (
        <div className="drawer-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="crm-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <h3>+ Nayi Lead Register Karein</h3>
              <button className="btn-icon-soft" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateLead}>
              <div className="crm-modal-body">
                <div className="crm-form-group">
                  <label>Yatri Ka Naam *</label>
                  <input
                    className="crm-form-input"
                    type="text"
                    required
                    placeholder="e.g. Ramesh Chandra"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  />
                </div>
                <div className="crm-form-group">
                  <label>Phone / WhatsApp *</label>
                  <input
                    className="crm-form-input"
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  />
                </div>
                <div className="crm-form-group">
                  <label>Pavitra Dham (Destination)</label>
                  <select
                    className="crm-form-select"
                    value={addForm.destination}
                    onChange={(e) => setAddForm({ ...addForm, destination: e.target.value })}
                  >
                    <option value="Ayodhya">Ayodhya Shri Ram Mandir</option>
                    <option value="Kedarnath">Kedarnath & Do Dham</option>
                    <option value="Vaishno Devi">Mata Vaishno Devi</option>
                    <option value="Char Dham">Uttarakhand Char Dham</option>
                    <option value="Tirupati Balaji">Tirupati Balaji</option>
                    <option value="Kashi Varanasi">Kashi Vishwanath</option>
                    <option value="Mathura Vrindavan">Mathura Vrindavan</option>
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="crm-form-group">
                    <label>Kitne Yatri?</label>
                    <input
                      className="crm-form-input"
                      type="number"
                      min="1"
                      placeholder="e.g. 4"
                      value={addForm.travellers}
                      onChange={(e) => setAddForm({ ...addForm, travellers: e.target.value })}
                    />
                  </div>
                  <div className="crm-form-group">
                    <label>Preferred Date</label>
                    <input
                      className="crm-form-input"
                      type="text"
                      placeholder="e.g. 15 May ya June"
                      value={addForm.preferred_date}
                      onChange={(e) => setAddForm({ ...addForm, preferred_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="crm-form-group">
                  <label>Remarks / Notes</label>
                  <textarea
                    className="crm-form-textarea"
                    rows="2"
                    placeholder="Special requirements (senior citizen, palki, budget)..."
                    value={addForm.notes}
                    onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="crm-modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: WHATSAPP TEMPLATE SENDER ================= */}
      {showWaModal && (
        <div className="drawer-backdrop" onClick={() => setShowWaModal(null)}>
          <div className="crm-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <h3>📱 Devotional WhatsApp Templates</h3>
              <button className="btn-icon-soft" onClick={() => setShowWaModal(null)}>✕</button>
            </div>
            <div className="crm-modal-body">
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--crm-text-secondary)" }}>
                <strong>{showWaModal.name}</strong> ({showWaModal.phone}) ke liye template choose karein:
              </p>

              <div className="wa-templates-grid">
                <div className="wa-template-card" onClick={() => sendWhatsApp(showWaModal, "welcome")}>
                  <strong>1. Welcome & Initial Follow-up 🙏</strong>
                  <p>"Namaste {showWaModal.name} ji 🙏 Aapne Yatra Saathi par {showWaModal.destination} yatra ke liye enquiry ki thi..."</p>
                </div>

                <div className="wa-template-card" onClick={() => sendWhatsApp(showWaModal, "quote")}>
                  <strong>2. Package Details & Itinerary Offer 📦</strong>
                  <p>"Jai Shri Ram {showWaModal.name} ji 🙏 {showWaModal.destination} package mein transport, hotel stay aur darshan assist shamil hai..."</p>
                </div>

                <div className="wa-template-card" onClick={() => sendWhatsApp(showWaModal, "booked")}>
                  <strong>3. Final Booking & Seat Confirmation 🟢</strong>
                  <p>"Namaste {showWaModal.name} ji 🙏 {showWaModal.destination} yatra booking seats confirm karne ke liye itinerary taiyaar hai..."</p>
                </div>
              </div>
            </div>
            <div className="crm-modal-footer">
              <button className="btn-secondary" onClick={() => setShowWaModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CONFIRM DELETE MODAL ================= */}
      {confirmDeleteId && (
        <div className="drawer-backdrop" onClick={() => setConfirmDeleteId(null)}>
          <div className="crm-modal-box" style={{ maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <h3 style={{ color: "var(--crm-danger)" }}>Delete Lead Confirmation</h3>
              <button className="btn-icon-soft" onClick={() => setConfirmDeleteId(null)}>✕</button>
            </div>
            <div className="crm-modal-body">
              <p style={{ margin: 0 }}>Kya aap sach mein is lead ko delete karna chahte hain? Yeh action revert nahi ho sakta.</p>
            </div>
            <div className="crm-modal-footer">
              <button className="btn-secondary" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              <button
                className="btn-primary"
                style={{ background: "var(--crm-danger)" }}
                onClick={handleConfirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TOAST NOTIFICATIONS ================= */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className="toast-item">
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
