import { useState } from "react";
import Chatbot from "./components/Chatbot";

const destinations = [
  { id: "ayodhya", name: "Ayodhya", hindi: "Ram ki Nagri", days: "2 din · 1 raat", price: "₹3,999", from: "Delhi se", icon: "ॐ", tone: "peach" },
  { id: "vaishno", name: "Vaishno Devi", hindi: "Mata ka Dham", days: "4 din · 3 raat", price: "₹8,499", from: "Delhi se", icon: "श्री", tone: "lavender" },
  { id: "chardham", name: "Char Dham", hindi: "Himalaya Yatra", days: "10 din · 9 raat", price: "₹24,999", from: "Haridwar se", icon: "ॐ", tone: "sage" },
  { id: "tirupati", name: "Tirupati", hindi: "Balaji Darshan", days: "3 din · 2 raat", price: "₹9,999", from: "Chennai se", icon: "श्री", tone: "gold" },
];

function Icon({ name, size = 18 }) {
  const paths = {
    arrow: <><path d="M4 12h15"/><path d="m13 5 7 7-7 7"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    sparkle: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z"/><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8Z"/></>,
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

function PackageCard({ tour, onChoose }) {
  return (
    <button className="package-card" onClick={() => onChoose(tour)}>
      <span className={`package-art ${tour.tone}`}><span>{tour.icon}</span></span>
      <span className="package-copy">
        <span className="package-hindi">{tour.hindi}</span>
        <strong>{tour.name}</strong>
        <span className="package-meta"><Icon name="clock" size={14}/>{tour.days}</span>
      </span>
      <span className="package-rate"><strong>{tour.price}<small>*</small></strong><span>/ vyakti se</span></span>
    </button>
  );
}

export default function App() {
  const jumpToChat = () => {
    document.querySelector("#assistant")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleChooseTour = (tour) => {
    jumpToChat();
  };

  return (
    <div className="site-shell">
      {/* Topbar */}
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Yatra Saathi home">
          <span className="brand-mark">ॐ</span>
          <span>
            <strong>Yatra Saathi</strong>
            <small>Faithful journeys, made simple</small>
          </span>
        </a>
        <nav className="nav-links" aria-label="Main navigation">
          <a href="#destinations">Yatra places</a>
          <a href="#how-it-works">How it works</a>
        </nav>
        <button className="nav-cta" onClick={jumpToChat}>
          Plan a yatra <Icon name="arrow" size={16}/>
        </button>
      </header>

      <main id="top">
        {/* Hero Section */}
        <section className="hero wrap">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot"/>A better way to go on yatra</div>
            <h1>Safar bhakti ka.<br/><em>Planning</em> aasaan.</h1>
            <p className="hero-description">
              Darshan ka iraada ho, budget ki chinta nahi. Apne liye sahi teerth yatra dhoondhiye aur hamara AI sahayak aapko step by step guide karega.
            </p>
            <div className="hero-actions">
              <button className="button-primary" onClick={jumpToChat}>
                Apni yatra plan karein <Icon name="arrow" size={17}/>
              </button>
              <a className="text-link" href="#destinations">Popular yatras dekhein <span>↓</span></a>
            </div>
            <div className="hero-assurance">
              <span className="assurance-icon"><Icon name="sparkle"/></span>
              <span><strong>Saaf package details</strong><small>Price, duration aur departure ek jagah</small></span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="art-frame">
              <PilgrimageArt/>
              <div className="art-label">
                <span className="art-label-icon">✦</span>
                <span><strong>Find your moment of peace</strong><small>Har yatra ki shuruaat ek iraade se</small></span>
              </div>
            </div>
            <div className="floating-note">
              <span className="floating-note-icon">↗</span>
              <span><small>Start your journey</small><strong>Ek kadam darshan ki ore</strong></span>
            </div>
            <div className="sun-doodle" aria-hidden="true">✳</div>
          </div>

          {/* DEDICATED REDESIGNED CHATBOT COMPONENT */}
          <section id="assistant" style={{ gridColumn: "span 2", width: "100%", marginTop: "24px" }}>
            <Chatbot onSelectPackage={handleChooseTour} />
          </section>
        </section>

        {/* Destination Section */}
        <section className="destination-section wrap" id="destinations">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Aapki agli manzil</div>
              <h2>Popular yatra packages</h2>
            </div>
            <a className="view-all" href="#assistant" onClick={jumpToChat}>
              Sabhi options poochhein <Icon name="arrow" size={16}/>
            </a>
          </div>
          <div className="destination-grid">
            {destinations.map((tour) => (
              <PackageCard key={tour.id} tour={tour} onChoose={handleChooseTour}/>
            ))}
          </div>
          <p className="price-disclaimer">* Yeh demo rates sirf sample data hain. Actual packages, prices aur dates organiser se confirm karein.</p>
        </section>

        {/* How it works */}
        <section className="how-section" id="how-it-works">
          <div className="wrap how-inner">
            <span>01 · Destination batayein</span>
            <span>02 · Date aur group size dein</span>
            <span>03 · Team se follow-up lein</span>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer wrap">
        <a className="brand footer-brand" href="#top">
          <span className="brand-mark">ॐ</span>
          <span><strong>Yatra Saathi</strong><small>Bhakti, bina uljhan.</small></span>
        </a>
        <span>Made for meaningful journeys <b>✦</b></span>
      </footer>
    </div>
  );
}
