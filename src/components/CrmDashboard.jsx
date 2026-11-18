import { useEffect, useState, useCallback } from "react";
import { fetchLeads, updateLead, deleteLead, getLeadStats } from "../services/databaseService";
import "./CrmDashboard.css";

const STATUS_OPTIONS = [
  { value: "new", label: "🟡 New", cls: "new" },
  { value: "contacted", label: "🔵 Contacted", cls: "contacted" },
  { value: "booked", label: "🟢 Booked", cls: "booked" },
  { value: "cancelled", label: "🔴 Cancelled", cls: "cancelled" },
];

function StatusBadge({ status }) {
  const opt = STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
  return <span className={`status-badge ${opt.cls}`}>{opt.label}</span>;
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("hi-IN", { day: "numeric", month: "short", year: "numeric" }) +
    " " + d.toLocaleTimeString("hi-IN", { hour: "2-digit", minute: "2-digit" });
}

function openWhatsApp(lead) {
  const dest = lead.destination || "yatra";
  const msg = encodeURIComponent(
    `Namaste ${lead.name || ""} ji 🙏\nAapne Yatra Saathi par *${dest}* yatra ke liye enquiry ki thi.\nHumari team aapki yatra plan karne mein kaise madad kar sakti hai?`
  );
  const phone = lead.phone ? `91${lead.phone.replace(/\D/g, "").slice(-10)}` : "";
  window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
}

export default function CrmDashboard({ onSwitchToChat }) {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [leadsData, statsData] = await Promise.all([fetchLeads(), getLeadStats()]);
    setLeads(leadsData);
    setStats(statsData);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    // Auto-refresh every 15 seconds
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleStatusChange = async (id, newStatus) => {
    await updateLead(id, { status: newStatus });
    loadData();
  };

  const handleNotesChange = async (id, notes) => {
    await updateLead(id, { notes });
    // Update locally without full reload
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, notes } : l)));
  };

  const handleDelete = async (id) => {
    if (!confirm("Kya aap is lead ko permanently delete karna chahte hain?")) return;
    await deleteLead(id);
    loadData();
  };

  // Filter & search
  const filtered = leads.filter((lead) => {
    if (filterStatus !== "all" && lead.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        (lead.name || "").toLowerCase().includes(q) ||
        (lead.phone || "").includes(q) ||
        (lead.destination || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="crm-root">
      {/* HEADER */}
      <header className="crm-header">
        <div className="crm-brand">
          <div className="crm-logo">ॐ</div>
          <div>
            <h2>Yatra Saathi CRM</h2>
            <p>Lead Management Dashboard</p>
          </div>
        </div>
        <div className="crm-header-actions">
          <button className="crm-btn" onClick={loadData} title="Refresh">
            🔄 Refresh
          </button>
          <button className="crm-btn" onClick={() => { sessionStorage.removeItem("yatra_crm_auth"); onSwitchToChat(); }} title="Logout">
            🔒 Logout
          </button>
          <button className="crm-btn primary" onClick={onSwitchToChat}>
            💬 Chatbot View
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="crm-content">
        {/* STAT CARDS */}
        <div className="crm-stats">
          <div className="stat-card">
            <span className="stat-label">Total Leads</span>
            <span className="stat-value">{stats.total || 0}</span>
          </div>
          <div className="stat-card orange">
            <span className="stat-label">🟡 New (Pending)</span>
            <span className="stat-value">{stats.new || 0}</span>
          </div>
          <div className="stat-card blue">
            <span className="stat-label">🔵 Contacted</span>
            <span className="stat-value">{stats.contacted || 0}</span>
          </div>
          <div className="stat-card green">
            <span className="stat-label">🟢 Booked</span>
            <span className="stat-value">{stats.booked || 0}</span>
          </div>
          <div className="stat-card gold">
            <span className="stat-label">🔥 Top Destination</span>
            <span className="stat-value" style={{ fontSize: "1.3rem", textTransform: "capitalize" }}>
              {stats.topDestination || "—"}
            </span>
            <span className="stat-sub">{stats.topDestCount ? `${stats.topDestCount} enquiries` : ""}</span>
          </div>
        </div>

        {/* SEARCH & FILTER */}
        <div className="crm-toolbar">
          <input
            className="crm-search"
            type="text"
            placeholder="🔍 Search by naam, phone ya destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="crm-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="new">🟡 New</option>
            <option value="contacted">🔵 Contacted</option>
            <option value="booked">🟢 Booked</option>
            <option value="cancelled">🔴 Cancelled</option>
          </select>
        </div>

        {/* LEADS TABLE */}
        {loading && leads.length === 0 ? (
          <div className="crm-empty">
            <p>Loading leads...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="crm-empty">
            <h3>🕉️ Koi lead nahi mili</h3>
            <p>
              {leads.length === 0
                ? "Jaise hi koi visitor chatbot mein apna naam aur number dega, uski lead yahan dikhegi."
                : "Search ya filter badal kar dekhein."}
            </p>
          </div>
        ) : (
          <div className="crm-table-wrap">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Naam</th>
                  <th>Phone</th>
                  <th>Destination</th>
                  <th>Yatri</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Enquiry Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => (
                  <tr key={lead.id}>
                    <td><strong>{lead.name || "—"}</strong></td>
                    <td>{lead.phone || "—"}</td>
                    <td style={{ textTransform: "capitalize" }}>{lead.destination || "—"}</td>
                    <td>{lead.travellers || "—"}</td>
                    <td>{lead.preferred_date || "—"}</td>
                    <td>
                      <select
                        className="status-select"
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        className="notes-input"
                        type="text"
                        value={lead.notes || ""}
                        placeholder="Note likhein..."
                        onChange={(e) => handleNotesChange(lead.id, e.target.value)}
                      />
                    </td>
                    <td style={{ fontSize: "0.78rem", color: "#7E726A" }}>{formatDate(lead.created_at)}</td>
                    <td>
                      <div className="action-row">
                        {lead.phone && (
                          <button className="wa-btn" onClick={() => openWhatsApp(lead)} title="WhatsApp par message bhejein">
                            📱 WhatsApp
                          </button>
                        )}
                        <button className="del-btn" onClick={() => handleDelete(lead.id)} title="Delete lead">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

