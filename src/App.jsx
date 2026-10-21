import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Home, Calendar as CalendarIcon, Droplet, MapPin, User, Plus, Check, Trash2,
  Sun, Bell, BellOff, MessageSquare, Mail, ChevronRight, ChevronLeft, ExternalLink,
  Sparkles, Flame, ShieldCheck, RefreshCw, Users, Info, Bot, Send,
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/*  Persistence — real localStorage, wrapped so it never crashes.         */
/* ---------------------------------------------------------------------- */

const STORAGE_KEY = "sportssteps_v1";

function loadSaved() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function saveState(data) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}
function clearSaved() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

/* ---------------------------------------------------------------------- */
/*  Themes                                                                 */
/* ---------------------------------------------------------------------- */

const PALETTES = {
  vivid: {
    label: "Vivid", dot: "#2E5EFF",
    bg: "#F4F6FB", card: "#FFFFFF", line: "#E4E8F1",
    ink: "#151A2E", inkFaint: "#6B7189",
    primary: "#2E5EFF", primarySoft: "#E4EAFF",
    accent: "#FF6B4A", accentSoft: "#FFE7DF",
    good: "#1FAA6E", goodSoft: "#DFF6EA",
    onBrand: "#FFFFFF", overlay: "rgba(255,255,255,0.22)",
  },
  calm: {
    label: "Calm", dot: "#6E8C75",
    bg: "#F7F6F1", card: "#FFFFFF", line: "#E7E4DA",
    ink: "#41413B", inkFaint: "#8C8B80",
    primary: "#6E8C75", primarySoft: "#E4EBE2",
    accent: "#7FA0B3", accentSoft: "#E4EDF1",
    good: "#6E8C75", goodSoft: "#E4EBE2",
    onBrand: "#FFFFFF", overlay: "rgba(255,255,255,0.22)",
  },
  dark: {
    label: "Dark", dot: "#5B8CFF",
    bg: "#111422", card: "#1A1F35", line: "#2A2F49",
    ink: "#F2F4FF", inkFaint: "#9AA0C2",
    primary: "#5B8CFF", primarySoft: "#243257",
    accent: "#FF8A65", accentSoft: "#3A2A22",
    good: "#3DDC84", goodSoft: "#173323",
    onBrand: "#FFFFFF", overlay: "rgba(255,255,255,0.18)",
  },
  highContrast: {
    label: "High Contrast", dot: "#FFD400",
    bg: "#000000", card: "#111111", line: "#FFFFFF",
    ink: "#FFFFFF", inkFaint: "#FFD400",
    primary: "#FFD400", primarySoft: "#332B00",
    accent: "#00E5FF", accentSoft: "#00343A",
    good: "#00FF7F", goodSoft: "#002B14",
    onBrand: "#000000", overlay: "rgba(0,0,0,0.18)",
  },
};

const display = "'Baloo 2', 'Nunito', sans-serif";
const body = "'Nunito', 'Segoe UI', sans-serif";

const SPORTS = [
  "Tennis", "Volleyball", "Soccer", "Football", "Baseball", "Basketball",
  "Swimming", "Track & Field", "Wrestling", "Golf", "Cross Country", "Lacrosse", "Other",
];

const SUPPORT_OPTIONS = [
  { key: "autism", icon: "🧩", label: "Autism / sensory-sensitive", hint: "Calmer colors, shorter alerts" },
  { key: "adhd", icon: "⚡", label: "ADHD", hint: "More frequent, bite-sized reminders" },
  { key: "mobility", icon: "♿", label: "Physical / mobility disability", hint: "Adaptive equipment reminders" },
  { key: "visual", icon: "👁️", label: "Visual impairment", hint: "High-contrast theme, larger text" },
  { key: "hearing", icon: "🔇", label: "Hearing impairment", hint: "Visual alerts only, no sound" },
  { key: "chronic", icon: "💊", label: "Chronic condition", hint: "Medication and check-in reminders" },
];

// Real national organizations with local chapters/programs, one per support need.
const RESOURCE_MAP = {
  autism: { icon: "🧩", org: "Autism Speaks Resource Guide", desc: "Local social groups, recreation programs, and services for autistic youth.", url: "https://www.autismspeaks.org/resource-guide" },
  adhd: { icon: "⚡", org: "CHADD Affiliate Locator", desc: "Nationwide ADHD peer support groups and chapters for kids, teens, and families.", url: "https://chadd.org/affiliate-locator/" },
  mobility: { icon: "♿", org: "Move United", desc: "150+ local adaptive sports chapters across the US, all mobility levels welcome.", url: "https://moveunitedsport.org/chapters/location-map/" },
  visual: { icon: "👁️", org: "USABA", desc: "United States Association of Blind Athletes — sports programs for blind and visually impaired athletes.", url: "https://www.usaba.org" },
  hearing: { icon: "🔇", org: "USA Deaf Sports Federation", desc: "National governing body connecting deaf and hard-of-hearing athletes and clubs.", url: "https://www.usdeafsports.org" },
  chronic: { icon: "💊", org: "ACA Find a Camp", desc: "Search camps and programs that can be filtered for specific health conditions.", url: "https://www.acacamps.org/campers-families/find-camp" },
};

const NEARBY_MEETS = [
  { emoji: "🎾", title: "Fall Invitational", dist: "3 mi" },
  { emoji: "⚽", title: "Youth Soccer Cup", dist: "9 mi" },
  { emoji: "🏊", title: "County Swim Meet", dist: "12 mi" },
];

const FOOD = {
  pre: [{ emoji: "🍌", label: "Banana + peanut butter toast" }, { emoji: "💧", label: "16 oz water" }],
  post: [{ emoji: "🥪", label: "Protein + carbs, e.g. a wrap" }, { emoji: "💧", label: "20 oz water + electrolytes" }],
};

const DEFAULT_EVENTS = [
  { id: "e1", emoji: "🎾", title: "Practice", day: "Tue", time: "4:30 PM" },
  { id: "e2", emoji: "🎾", title: "Match", day: "Thu", time: "5:00 PM" },
  { id: "e3", emoji: "🎾", title: "Tournament", day: "Sat", time: "8:00 AM" },
];

const DEFAULT_CHECKLIST = [
  { label: "Water bottle", emoji: "💧", done: false },
  { label: "Sunscreen", emoji: "🧴", done: false },
  { label: "Equipment", emoji: "🎒", done: false },
];

function suggestedTheme(support) {
  if (support.has("visual")) return "highContrast";
  if (support.has("autism") || support.has("adhd")) return "calm";
  return "vivid";
}

/* ---------------------------------------------------------------------- */

function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@400;600;700;800&display=swap');
      @keyframes fadeSlideIn { from { opacity:0; transform:translateY(10px);} to { opacity:1; transform:translateY(0);} }
      @keyframes popIn { 0% { transform:scale(0.6); opacity:0;} 70% { transform:scale(1.08);} 100% { transform:scale(1); opacity:1;} }
      @keyframes floatSlow { 0%,100% { transform:translateY(0);} 50% { transform:translateY(-6px);} }
      @keyframes confettiFall { from { transform:translateY(-20px) rotate(0deg); opacity:1;} to { transform:translateY(140px) rotate(240deg); opacity:0;} }
      @keyframes ringPulse { 0% { box-shadow:0 0 0 0 rgba(46,94,255,0.35);} 100% { box-shadow:0 0 0 14px rgba(46,94,255,0);} }
      @keyframes spin { to { transform:rotate(360deg); } }
      .fade-in { animation: fadeSlideIn 0.35s ease both; }
      .pop-in { animation: popIn 0.35s cubic-bezier(.34,1.56,.64,1) both; }
      .float { animation: floatSlow 3.5s ease-in-out infinite; }
      .pulse-ring { animation: ringPulse 1.6s ease-out infinite; }
      .spin { animation: spin 0.9s linear infinite; }

      .app-shell { display: flex; min-height: 100vh; }
      .sidebar-nav { width: 240px; flex-shrink: 0; padding: 28px 16px; display: flex; flex-direction: column; gap: 4px; }
      .main-content { flex: 1; min-width: 0; padding: 40px 48px 60px; overflow-y: auto; }
      .content-max { max-width: 1000px; margin: 0 auto; }
      .bottom-tabbar { display: none; }
      .dashboard-grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 20px; align-items: start; }

      @media (max-width: 900px) {
        .sidebar-nav { display: none; }
        .main-content { padding: 24px 18px 96px; }
        .dashboard-grid { grid-template-columns: 1fr; }
        .bottom-tabbar { display: flex; }
      }

      *, *::before, *::after { box-sizing: border-box; }
      body { margin: 0; }
      .land-wrap { max-width: 1120px; margin: 0 auto; padding: 0 24px; }
      .land-hero { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 48px; align-items: center; padding: 64px 0 56px; }
      .land-grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
      .land-h1 { font-size: clamp(34px, 5.2vw, 56px); line-height: 1.05; }
      .land-btn { transition: transform 0.15s ease, box-shadow 0.15s ease; }
      .land-btn:hover { transform: translateY(-2px); }
      .land-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
      .land-card:hover { transform: translateY(-3px); box-shadow: 0 18px 36px -24px rgba(20,25,45,0.35); }
      @media (max-width: 900px) {
        .land-hero { grid-template-columns: 1fr; gap: 36px; padding: 36px 0 40px; }
        .land-grid3 { grid-template-columns: 1fr 1fr; }
      }
      @media (max-width: 560px) {
        .land-wrap { padding: 0 16px; }
        .land-grid3 { grid-template-columns: 1fr; }
        .land-logo-text { display: none; }
        .land-tab { padding: 8px 10px !important; }
        .land-tab svg { display: none; }
        .land-cta { padding: 9px 12px !important; font-size: 13px !important; }
        .land-cta svg { display: none; }
      }

      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; }
      }
    `}</style>
  );
}

function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 16 }, (_, i) => ({
    left: Math.random() * 100, delay: Math.random() * 0.4,
    color: ["#2E5EFF", "#FF6B4A", "#1FAA6E", "#FFC93C"][i % 4],
  })), []);
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 50 }}>
      {pieces.map((p, i) => (
        <div key={i} style={{ position: "absolute", top: 0, left: `${p.left}%`, width: 8, height: 8, background: p.color, borderRadius: 2, animation: `confettiFall 1.3s ease-out ${p.delay}s both` }} />
      ))}
    </div>
  );
}

function ThemeSwatches({ p, current, onSelect }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {Object.entries(PALETTES).map(([key, pal]) => (
        <button key={key} onClick={() => onSelect(key)} style={{
          display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
          background: current === key ? p.primarySoft : p.card,
          border: `1px solid ${current === key ? p.primary : p.line}`,
          borderRadius: 14, padding: "10px 14px",
        }}>
          <span style={{ width: 16, height: 16, borderRadius: "50%", background: pal.dot, display: "block", flexShrink: 0, border: "1px solid rgba(0,0,0,0.1)" }} />
          <span style={{ fontFamily: body, fontSize: 12.5, fontWeight: 700, color: p.ink }}>{pal.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Welcome + onboarding                                                   */
/* ---------------------------------------------------------------------- */

function WelcomeScreen({ p, onStart }) {
  return (
    <div className="fade-in" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px", background: p.bg }}>
      <div className="float" style={{ width: 100, height: 100, borderRadius: 30, background: p.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, marginBottom: 24, boxShadow: `0 16px 34px -10px ${p.primary}66` }}>🏆</div>
      <h1 style={{ fontFamily: display, fontSize: 34, fontWeight: 800, color: p.ink, textAlign: "center", margin: 0 }}>SportsSteps</h1>
      <p style={{ fontFamily: body, fontSize: 15.5, color: p.inkFaint, textAlign: "center", marginTop: 10, lineHeight: 1.5, maxWidth: 320 }}>
        Prep like a pro. Water, food, weather, and gear — sorted before you even ask.
      </p>
      <button onClick={onStart} className="pulse-ring" style={{ marginTop: 34, background: p.primary, color: p.onBrand, border: "none", borderRadius: 18, padding: "16px 36px", fontFamily: body, fontWeight: 800, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
        Get started <ChevronRight size={19} />
      </button>
      <p style={{ fontFamily: body, fontSize: 12, color: p.inkFaint, marginTop: 16 }}>Takes under a minute · barely any typing</p>
    </div>
  );
}

function ProgressDots({ p, step, total }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: 6, borderRadius: 4, background: i <= step ? p.primary : p.line, transition: "background 0.3s ease" }} />
      ))}
    </div>
  );
}

function OnboardStepShell({ p, title, sub, children, onBack, onNext, nextLabel = "Next", showBack = true }) {
  return (
    <div className="fade-in" key={title} style={{ display: "flex", flexDirection: "column" }}>
      <h2 style={{ fontFamily: display, fontSize: 24, fontWeight: 700, color: p.ink, margin: "0 0 4px" }}>{title}</h2>
      {sub && <p style={{ fontFamily: body, fontSize: 13.5, color: p.inkFaint, margin: "0 0 20px" }}>{sub}</p>}
      <div>{children}</div>
      <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
        {showBack && (
          <button onClick={onBack} style={{ width: 50, flexShrink: 0, background: p.bg, border: `1px solid ${p.line}`, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ChevronLeft size={19} color={p.ink} />
          </button>
        )}
        <button onClick={onNext} style={{ flex: 1, background: p.primary, color: p.onBrand, border: "none", borderRadius: 16, fontFamily: body, fontWeight: 800, fontSize: 15, cursor: "pointer", padding: "14px 0" }}>
          {nextLabel}
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Shared bits                                                            */
/* ---------------------------------------------------------------------- */

function PageHeader({ p, title, subtitle }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h1 style={{ fontFamily: display, fontSize: 28, color: p.ink, fontWeight: 800, margin: 0 }}>{title}</h1>
      {subtitle && <p style={{ fontFamily: body, fontSize: 13.5, color: p.inkFaint, margin: "4px 0 0" }}>{subtitle}</p>}
    </div>
  );
}

function Card({ p, children, style, className }) {
  return <div className={className} style={{ background: p.card, border: `1px solid ${p.line}`, borderRadius: 20, padding: 20, ...style }}>{children}</div>;
}

function HydrationRing({ p, pct, size = 100 }) {
  const r = 42, c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);
  const vb = 100;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`}>
        <circle cx={vb / 2} cy={vb / 2} r={r} fill="none" stroke={p.accentSoft} strokeWidth="10" />
        <circle cx={vb / 2} cy={vb / 2} r={r} fill="none" stroke={p.accent} strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} transform={`rotate(-90 ${vb / 2} ${vb / 2})`} style={{ transition: "stroke-dashoffset 0.5s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: display, fontWeight: 800, fontSize: 19, color: p.ink }}>{pct}%</span>
      </div>
    </div>
  );
}

function Switch({ p, value, onChange }) {
  return (
    <button onClick={onChange} style={{ width: 44, height: 25, borderRadius: 99, border: "none", cursor: "pointer", flexShrink: 0, background: value ? p.primary : p.line, position: "relative", padding: 0 }}>
      <div style={{ width: 19, height: 19, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: value ? 22 : 3, transition: "left 0.15s ease" }} />
    </button>
  );
}

/* ---------------------------------------------------------------------- */
/*  Screens                                                                 */
/* ---------------------------------------------------------------------- */

function HomeScreen({ p, profile, checklist, toggleItem, hydration, goal, showInfo, setShowInfo, celebrate, streak, nextEvent, weather, fetchWeather, notif, requestNotif, sendReminder, addWater }) {
  const pct = Math.min(100, Math.round((hydration / goal) * 100));
  const allDone = checklist.length > 0 && checklist.every((i) => i.done);
  const hot = weather.tempF >= 90;
  const highUV = weather.uv >= 6;

  return (
    <div className="fade-in">
      {celebrate && <Confetti />}
      <PageHeader p={p} title={`Hey, ${profile.name || "athlete"} 👋`} subtitle={`${profile.sport} · next up`} />

      <div className="dashboard-grid">
        {/* LEFT column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: p.primary, borderRadius: 22, padding: "22px 26px" }}>
            <p style={{ fontFamily: body, fontSize: 12, fontWeight: 700, color: p.onBrand, opacity: 0.8, margin: 0 }}>NEXT UP</p>
            <p style={{ fontFamily: display, fontSize: 22, fontWeight: 800, color: p.onBrand, margin: "3px 0 10px" }}>
              {nextEvent ? `${nextEvent.title} · ${nextEvent.time}` : "Nothing scheduled"}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Sun size={16} color={p.onBrand} />
              <span style={{ fontFamily: body, fontSize: 13.5, color: p.onBrand, fontWeight: 700 }}>
                {weather.loading ? "Checking…" : `${weather.tempF}°F · UV ${weather.uv}`}
              </span>
              <button onClick={() => setShowInfo(!showInfo)} style={{ marginLeft: 4, width: 24, height: 24, borderRadius: "50%", border: "none", background: p.overlay, color: p.onBrand, cursor: "pointer", fontSize: 12, fontWeight: 800 }}>i</button>
              <button onClick={fetchWeather} title="Use my real location" style={{ width: 24, height: 24, borderRadius: "50%", border: "none", background: p.overlay, color: p.onBrand, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <RefreshCw size={12} className={weather.loading ? "spin" : ""} />
              </button>
            </div>
            {weather.error && <p style={{ fontFamily: body, fontSize: 11, color: p.onBrand, opacity: 0.85, margin: "8px 0 0" }}>{weather.error}</p>}
          </div>

          {showInfo && (
            <Card p={p} style={{ background: p.accentSoft, border: "none" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                <Sparkles size={14} color={p.accent} style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontFamily: body, fontSize: 11, fontWeight: 800, color: p.accent, letterSpacing: 0.3 }}>AI PREP NOTE</span>
              </div>
              <p style={{ fontFamily: body, fontSize: 13.5, color: p.ink, lineHeight: 1.55, margin: 0 }}>
                {nextEvent ? `You have a ${profile.sport.toLowerCase()} ${nextEvent.title.toLowerCase()} coming up at ${nextEvent.time}. ` : ""}
                {hot ? `It'll be ${weather.tempF}°F` : `It'll be a mild ${weather.tempF}°F`}
                {highUV ? ` with a UV index of ${weather.uv}. Start hydrating tonight and pack sunscreen, electrolytes, and a cooling towel.` : `. Pack your water and gear the night before.`}
                {" "}You forgot your bag last time — it's on today's list.
              </p>
            </Card>
          )}

          <div>
            <p style={{ fontFamily: body, fontSize: 12.5, fontWeight: 800, color: p.inkFaint, margin: "0 0 10px" }}>Pack today</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {checklist.map((item, i) => (
                <button key={item.label} onClick={() => toggleItem(i)} style={{ display: "flex", alignItems: "center", gap: 12, background: item.done ? p.goodSoft : p.card, border: `1px solid ${item.done ? p.good : p.line}`, borderRadius: 16, padding: "13px 16px", cursor: "pointer", textAlign: "left" }}>
                  <span style={{ fontSize: 19 }}>{item.emoji}</span>
                  <span style={{ flex: 1, fontFamily: body, fontWeight: 700, fontSize: 14, color: p.ink, opacity: item.done ? 0.55 : 1, textDecoration: item.done ? "line-through" : "none" }}>{item.label}</span>
                  <div className={item.done ? "pop-in" : ""} style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, background: item.done ? p.good : p.bg, border: item.done ? "none" : `2px solid ${p.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {item.done && <Check size={14} color="#fff" strokeWidth={3} />}
                  </div>
                </button>
              ))}
            </div>
            {allDone && (
              <p className="pop-in" style={{ fontFamily: body, fontSize: 13.5, fontWeight: 800, color: p.good, textAlign: "center", margin: "10px 0 0" }}>All packed. Go get it! 🎉</p>
            )}
          </div>
        </div>

        {/* RIGHT column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card p={p} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <HydrationRing p={p} pct={pct} />
            <p style={{ fontFamily: body, fontWeight: 800, fontSize: 14, color: p.ink, margin: 0 }}>{hydration} / {goal} oz</p>
            <button onClick={addWater} style={{ background: p.accent, color: p.onBrand, border: "none", borderRadius: 14, padding: "9px 18px", fontFamily: body, fontWeight: 800, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Plus size={14} /> Add 8oz
            </button>
          </Card>

          <Card p={p}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Flame size={17} color={p.accent} />
              <span style={{ fontFamily: body, fontSize: 13.5, fontWeight: 700, color: p.ink }}>{streak}-day prep streak</span>
            </div>
          </Card>

          <Card p={p}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {notif.permission === "granted" ? <Bell size={18} color={p.primary} /> : <BellOff size={18} color={p.inkFaint} />}
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: body, fontWeight: 700, fontSize: 13.5, color: p.ink, margin: 0 }}>
                  {notif.permission === "granted" ? "Reminders on" : notif.permission === "unsupported" ? "Not supported here" : "Reminders off"}
                </p>
              </div>
              {notif.permission === "granted" ? (
                <button onClick={sendReminder} style={{ background: p.primarySoft, color: p.primary, border: "none", borderRadius: 12, padding: "7px 12px", fontFamily: body, fontWeight: 800, fontSize: 12, cursor: "pointer" }}>Send test</button>
              ) : notif.permission !== "unsupported" ? (
                <button onClick={requestNotif} style={{ background: p.primary, color: p.onBrand, border: "none", borderRadius: 12, padding: "7px 12px", fontFamily: body, fontWeight: 800, fontSize: 12, cursor: "pointer" }}>Enable</button>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CalendarScreen({ p, events, addEvent, deleteEvent }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");

  const submit = () => {
    if (!title.trim()) return;
    addEvent({ id: `e${Date.now()}`, emoji: "🏅", title: title.trim(), day: day.trim() || "TBD", time: time.trim() || "TBD" });
    setTitle(""); setDay(""); setTime(""); setOpen(false);
  };

  return (
    <div className="fade-in">
      <PageHeader p={p} title="Calendar" subtitle="Your practices, matches, and meets" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 560 }}>
        {events.length === 0 && (
          <p style={{ fontFamily: body, fontSize: 13.5, color: p.inkFaint }}>Nothing on the calendar yet.</p>
        )}
        {events.map((e) => (
          <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 14, background: p.card, border: `1px solid ${p.line}`, borderRadius: 18, padding: "14px 16px" }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: p.primarySoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{e.emoji}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: body, fontWeight: 800, fontSize: 14, color: p.ink, margin: 0 }}>{e.title}</p>
              <p style={{ fontFamily: body, fontSize: 12, color: p.inkFaint, margin: "2px 0 0" }}>{e.day} · {e.time}</p>
            </div>
            <button onClick={() => deleteEvent(e.id)} title="Delete event" style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 10, display: "flex" }}>
              <Trash2 size={17} color={p.inkFaint} />
            </button>
          </div>
        ))}

        {open ? (
          <div className="fade-in" style={{ background: p.card, border: `1px solid ${p.line}`, borderRadius: 18, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event name" style={{ padding: "10px 12px", borderRadius: 12, border: `1px solid ${p.line}`, fontFamily: body, fontSize: 13.5 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <input value={day} onChange={(e) => setDay(e.target.value)} placeholder="Day (e.g. Fri)" style={{ flex: 1, padding: "10px 12px", borderRadius: 12, border: `1px solid ${p.line}`, fontFamily: body, fontSize: 13.5 }} />
              <input value={time} onChange={(e) => setTime(e.target.value)} placeholder="Time" style={{ flex: 1, padding: "10px 12px", borderRadius: 12, border: `1px solid ${p.line}`, fontFamily: body, fontSize: 13.5 }} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button onClick={() => setOpen(false)} style={{ flex: 1, background: p.bg, border: `1px solid ${p.line}`, borderRadius: 12, padding: "10px 0", fontFamily: body, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={submit} style={{ flex: 1, background: p.primary, color: p.onBrand, border: "none", borderRadius: 12, padding: "10px 0", fontFamily: body, fontWeight: 800, fontSize: 13, cursor: "pointer" }}>Add</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setOpen(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "none", border: `1.5px dashed ${p.line}`, borderRadius: 18, padding: "14px 0", fontFamily: body, fontWeight: 800, fontSize: 13.5, color: p.primary, cursor: "pointer" }}>
            <Plus size={16} /> Add event
          </button>
        )}
      </div>
    </div>
  );
}

function PrepScreen({ p, mode, setMode, hydration, goal, addWater, profile }) {
  const pct = Math.min(100, Math.round((hydration / goal) * 100));
  return (
    <div className="fade-in">
      <PageHeader p={p} title="Prep" subtitle="Hydration and fueling, made simple" />
      <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 480 }}>
        <Card p={p} style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <HydrationRing p={p} pct={pct} size={78} />
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: body, fontWeight: 800, fontSize: 14, color: p.ink, margin: 0 }}>{hydration} / {goal} oz</p>
            <button onClick={addWater} style={{ marginTop: 8, background: p.accent, color: p.onBrand, border: "none", borderRadius: 14, padding: "9px 16px", fontFamily: body, fontWeight: 800, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Plus size={14} /> Add 8oz
            </button>
          </div>
        </Card>

        <div style={{ display: "flex", background: p.card, border: `1px solid ${p.line}`, borderRadius: 16, padding: 5 }}>
          {["pre", "post"].map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{ flex: 1, border: "none", borderRadius: 12, padding: "10px 0", background: mode === m ? p.primarySoft : "transparent", fontFamily: body, fontWeight: 800, fontSize: 13.5, color: p.ink, cursor: "pointer" }}>
              {m === "pre" ? "🎒 Before" : "✅ After"}
            </button>
          ))}
        </div>

        {FOOD[mode].map((f) => (
          <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 12, background: p.card, border: `1px solid ${p.line}`, borderRadius: 16, padding: "13px 16px" }}>
            <span style={{ fontSize: 20 }}>{f.emoji}</span>
            <span style={{ fontFamily: body, fontWeight: 700, fontSize: 13.5, color: p.ink }}>{f.label}</span>
          </div>
        ))}

        {profile.support.has("chronic") && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: p.accentSoft, borderRadius: 16, padding: "13px 16px" }}>
            <span style={{ fontSize: 20 }}>💊</span>
            <span style={{ fontFamily: body, fontWeight: 700, fontSize: 13.5, color: p.ink }}>Medication check before you go</span>
          </div>
        )}
      </div>
    </div>
  );
}

function NearbyScreen({ p, profile }) {
  const supportKeys = [...profile.support].filter((k) => RESOURCE_MAP[k]);

  return (
    <div className="fade-in">
      <PageHeader p={p} title="Nearby" subtitle="Meets and communities near you" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, maxWidth: 900 }}>
        <div>
          <p style={{ fontFamily: body, fontSize: 12.5, fontWeight: 800, color: p.inkFaint, margin: "0 0 10px" }}>Meets near you</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {NEARBY_MEETS.map((e) => (
              <div key={e.title} style={{ display: "flex", alignItems: "center", gap: 14, background: p.card, border: `1px solid ${p.line}`, borderRadius: 18, padding: "14px 16px" }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: p.primarySoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{e.emoji}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: body, fontWeight: 800, fontSize: 13.5, color: p.ink, margin: 0 }}>{e.title}</p>
                  <p style={{ fontFamily: body, fontSize: 11.5, color: p.inkFaint, margin: "2px 0 0" }}>{e.dist} away</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p style={{ fontFamily: body, fontSize: 12.5, fontWeight: 800, color: p.inkFaint, margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
            <Users size={13} /> Community &amp; support
          </p>
          {supportKeys.length === 0 ? (
            <Card p={p} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontFamily: body, fontSize: 13, color: p.inkFaint, margin: 0, lineHeight: 1.5 }}>
                Add your support needs in Profile to see groups picked for you. Meanwhile, here's a good starting point open to everyone:
              </p>
              <a href="https://moveunitedsport.org/chapters/location-map/" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, background: p.primarySoft, color: p.primary, borderRadius: 12, padding: "10px 14px", textDecoration: "none", fontFamily: body, fontWeight: 800, fontSize: 12.5 }}>
                Move United chapters <ExternalLink size={13} />
              </a>
            </Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {supportKeys.map((key) => {
                const r = RESOURCE_MAP[key];
                return (
                  <Card key={key} p={p}>
                    <div style={{ display: "flex", gap: 12 }}>
                      <span style={{ fontSize: 20 }}>{r.icon}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontFamily: body, fontWeight: 800, fontSize: 13.5, color: p.ink, margin: 0 }}>{r.org}</p>
                        <p style={{ fontFamily: body, fontSize: 12, color: p.inkFaint, margin: "3px 0 10px", lineHeight: 1.4 }}>{r.desc}</p>
                        <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: p.primarySoft, color: p.primary, borderRadius: 12, padding: "8px 12px", textDecoration: "none", fontFamily: body, fontWeight: 800, fontSize: 12 }}>
                          Find a chapter near you <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AboutScreen({ p }) {
  return (
    <div className="fade-in">
      <PageHeader p={p} title="About Us" subtitle="The people behind SportsSteps" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, maxWidth: 900 }}>
        {ABOUT_PEOPLE.map((person) => (
          <Card key={person.name} p={p} style={{ padding: 0, overflow: "hidden" }}>
            <img
              src={`${import.meta.env.BASE_URL}${person.photo}`}
              alt={person.name}
              style={{ width: "100%", aspectRatio: "4 / 5", objectFit: "cover", objectPosition: "center top", display: "block" }}
            />
            <div style={{ padding: "16px 18px 20px" }}>
              <p style={{ fontFamily: display, fontSize: 20, fontWeight: 800, color: p.ink, margin: 0 }}>{person.name}</p>
              <p style={{ fontFamily: body, fontSize: 12, fontWeight: 800, color: p.primary, margin: "2px 0 10px" }}>{person.role}</p>
              <p style={{ fontFamily: body, fontSize: 13.5, color: p.inkFaint, margin: 0, lineHeight: 1.6, whiteSpace: "pre-line" }}>{person.bio}</p>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ maxWidth: 900, marginTop: 20 }}>
        <Card p={p}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: p.primarySoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={18} color={p.primary} />
            </div>
            <p style={{ fontFamily: display, fontSize: 18, fontWeight: 800, color: p.ink, margin: 0 }}>{APP_PURPOSE.title}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {APP_PURPOSE.body.map((para, i) => (
              <p key={i} style={{ fontFamily: body, fontSize: 13.5, color: p.inkFaint, margin: 0, lineHeight: 1.6 }}>{para}</p>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Parent AI assistant                                                    */
/*                                                                         */
/*  Three modes (checked in this order):                                   */
/*   1. Proxy  - VITE_CHAT_API_URL points at your own server (Cloudflare   */
/*      Worker in chat-proxy/). The Groq key stays secret. Use this for    */
/*      the live site.                                                     */
/*   2. Direct - VITE_GROQ_API_KEY in a .env.local file. Calls Groq right  */
/*      from the browser. Fine for testing on your own computer, but the   */
/*      key is visible to anyone who opens the deployed site, so do not    */
/*      deploy with it.                                                    */
/*   3. Built-in - no setup. Uses the guidance library below, so the chat  */
/*      always works, even offline.                                        */
/*  Never type an API key into this file.                                  */
/* ---------------------------------------------------------------------- */

const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL || "";
const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile"; // faster/cheaper: "llama-3.1-8b-instant"
const AI_ON = !!(CHAT_API_URL || GROQ_KEY);

// Used by direct mode. (The proxy keeps its own copy in chat-proxy/worker.js.)
const AI_SYSTEM_PROMPT = `You are the SportsSteps parent assistant. You help parents and caregivers of student athletes prepare for practices, games, and tournaments.

Adapt every answer to the athlete's support needs listed in the context. Examples of useful adaptations:
- Autism / sensory-sensitive: predictable routines, visual schedules, previewing the venue, quiet breaks, sensory comfort items.
- ADHD: short steps, timers, visual checklists, movement breaks, one instruction at a time.
- Physical / mobility disability: venue accessibility, adaptive equipment checks, transfers, travel logistics.
- Visual impairment: familiarizing with the space, describing drills out loud, high-contrast gear, glare.
- Hearing impairment: visual or written play calls, device care and spare batteries, positioning near the coach.
- Chronic condition: care-plan reminders, who at the event knows the plan, rest and fuel timing.

Rules:
- Be warm, practical, and concise (under about 200 words). Use short bullet points when helpful.
- You are not a doctor. Never give medication doses, diagnose, or tell a parent to change a treatment. For health decisions, refer them to their child's doctor.
- If a message suggests an emergency, tell them to call 911 first.
- Do not ask for or repeat personal information such as full names, addresses, or phone numbers.
- Stay on topic (youth sports prep, routines, communication with coaches, wellbeing around sports). Politely decline unrelated requests.`;

const SUPPORT_SHORT = {
  autism: "autism / sensory needs", adhd: "ADHD", mobility: "mobility needs",
  visual: "low vision", hearing: "hearing needs", chronic: "a chronic condition",
};

const SUPPORT_PROMPTS = {
  autism: "How can I prepare my child for a loud, crowded game?",
  adhd: "Help me build a simple pre-game routine with short steps.",
  mobility: "What should I check about venue accessibility before a meet?",
  visual: "How can I help my child follow practice with low vision?",
  hearing: "How do I make sure the coach communicates in a way my child can follow?",
  chronic: "What should be in my child's game-day health plan?",
};

// Tips for the built-in assistant. `base` is for everyone; other keys match support needs.
const TIPS = {
  gameday: {
    title: "Here's how I'd approach game day",
    base: ["Pack the bag the night before using the checklist on the Home tab.", "Arrive early so your athlete can settle in before it gets busy.", "Build in buffer time for travel, warm-up, and a snack."],
    autism: ["Walk through the day in order. A simple picture or written schedule helps a lot.", "If you can, visit the venue ahead of time and find a quiet spot for breaks."],
    adhd: ["Break the morning into 3-4 small steps on a visual checklist.", "Use a timer for getting ready and give a heads-up 10 minutes before leaving."],
    mobility: ["Check accessible parking, entrances, restrooms, and seating before you go.", "Inspect adaptive equipment the night before, including chargers and spare parts."],
    visual: ["Walk the space ahead of time so the layout feels familiar.", "Ask the coach to describe drills out loud and use high-contrast markers or gear."],
    hearing: ["Ask for written or visual play calls and a spot in the huddle where your athlete can see the coach.", "Charge hearing devices and pack spare batteries."],
    chronic: ["Pack medications, supplies, and a copy of the care plan, and tell the coach where they are.", "Know where the nearest medical help is at the venue."],
  },
  hydration: {
    title: "Hydration basics",
    base: ["Sip steadily through the day instead of drinking a lot at once.", "Use the hydration goal on the Prep tab and tap to log each bottle.", "Pack a bottle that's easy to open and carry, and refill before the game."],
    autism: ["Some kids are sensitive to taste or temperature. Stick with a familiar bottle and drink they already like."],
    adhd: ["Tie sips to cues (every break, every water-break whistle) since thirst can get missed when focused."],
    mobility: ["Choose a bottle with a straw or easy-grip design that can be reached without help."],
    chronic: ["Fluid and electrolyte needs can differ with some conditions, so check your child's targets with their doctor."],
  },
  food: {
    title: "Fuel before and after",
    base: ["Before: a familiar meal with carbs and some protein about 2-3 hours ahead, plus a light snack closer to start time.", "After: protein plus carbs and water within an hour or so (see the Prep tab for ideas).", "Stick to foods your athlete already knows on game day. It's not the day to try something new."],
    autism: ["Bring safe, familiar foods in case venue food doesn't work for texture or smell."],
    adhd: ["Pack snacks that are easy to grab so eating doesn't get forgotten mid-event."],
    chronic: ["Meal timing may need to match your child's care plan, so follow their doctor's guidance."],
  },
  heat: {
    title: "Weather and sun safety",
    base: ["Check the forecast and UV index on the Home tab before heading out.", "Apply sunscreen 15-30 minutes before and reapply during long events.", "In heat, plan shade breaks, light clothing, and extra water. Stop and cool down if your athlete feels dizzy or unwell."],
    autism: ["Some kids don't mention discomfort. Check in regularly and look for signs like flushing or slowing down."],
    visual: ["Sunglasses or a visor can reduce glare for light-sensitive eyes."],
    chronic: ["Some conditions and medications make heat harder to handle, so ask your doctor about hot-weather precautions."],
  },
  coach: {
    title: "Talking with the coach",
    base: ["Share a short, positive summary: what helps your athlete do their best and what to do if they struggle.", "Offer a one-page note with key info and your contact number.", "Ask about accommodations early, before the first game. Schools often have formal plans (like a 504 or IEP) that can apply."],
    autism: ["Explain sensory triggers and what calming looks like, and agree on a break signal."],
    adhd: ["Ask the coach to give short, one-step instructions and positive reminders."],
    hearing: ["Ask for the coach to face your athlete when speaking and to share plans in writing."],
    visual: ["Ask the coach to name people and describe plays out loud."],
    mobility: ["Talk about equipment storage, transitions between spaces, and how drills can be adapted."],
    chronic: ["Share the emergency plan and make sure at least one adult knows what to do."],
  },
  calm: {
    title: "Helping with nerves and overwhelm",
    base: ["Validate the feeling first (\"This is a big day, it's okay to feel nervous\") before problem-solving.", "Agree on a break plan ahead of time: where to go and how to signal.", "Practice a simple calming routine at home, like slow breathing, so it's familiar on game day."],
    autism: ["Bring comfort items or headphones, and keep a quiet place ready. Previewing what will happen reduces surprises."],
    adhd: ["Use short movement breaks and a clear next step to turn restlessness into focus."],
    hearing: ["Crowded, loud venues can be tiring for hearing devices. Quiet breaks help."],
    chronic: ["Stress can affect some conditions, so keep routines steady and the care plan close by."],
  },
  gear: {
    title: "Packing and gear",
    base: ["Use the checklist on the Home tab and pack the night before.", "Keep a 'go bag' with the basics so you only add what changes.", "Lay out the uniform and shoes ahead of time to avoid a morning scramble."],
    mobility: ["Add chargers, spare parts, and any transfer or support items to the list."],
    hearing: ["Pack spare batteries and a dry-aid case for hearing devices."],
    visual: ["Include backup glasses or lenses and a visor."],
    chronic: ["Add medications and supplies to the checklist. Profile setup does this for you."],
  },
};

function localReply(text, profile, ctx = {}) {
  const t = text.toLowerCase();
  const keys = [...profile.support];

  if (/emergency|911|can't breathe|cannot breathe|unconscious|not breathing|seizure (now|right now)/.test(t)) {
    return "If this is an emergency, call 911 right now. Don't wait for a reply here. Once your athlete is safe, I'm happy to help with next steps.";
  }
  if (/medic|insulin|inhaler|epipen|dose|dosage|prescription|diabet|asthma/.test(t)) {
    const extra = keys.includes("chronic")
      ? "\n\nSince your profile includes a chronic condition, I added medication to your checklist as a reminder."
      : "";
    return "I can't give advice on medications or doses. Please follow your child's doctor's plan.\n\nWhat I can help with:\n• Add a medication reminder to the bag checklist.\n• Make sure the coach and one other adult know where the medication is and what to do.\n• Keep a copy of the care plan in the bag." + extra;
  }

  let topic = "gameday";
  if (/water|hydrat|drink|thirst|fluid/.test(t)) topic = "hydration";
  else if (/\beat|food|snack|meal|breakfast|lunch|dinner|fuel|nutrition/.test(t)) topic = "food";
  else if (/heat|hot\b|weather|sun|uv|sunscreen|cold|rain|temperature/.test(t)) topic = "heat";
  else if (/coach|teammate|accommodat|504|iep|explain|tell the|talk to/.test(t)) topic = "coach";
  else if (/anxi|nervous|overwhelm|meltdown|stress|scared|worried|panic|sensory|loud|crowd|upset|cry/.test(t)) topic = "calm";
  else if (/gear|pack|bag|equipment|checklist|forget|uniform|shoes/.test(t)) topic = "gear";

  const tips = TIPS[topic];
  const lines = [`${tips.title}:`, ...tips.base.map((x) => `• ${x}`)];
  keys.forEach((k) => {
    if (tips[k]) {
      lines.push("", `For ${SUPPORT_SHORT[k]}:`);
      tips[k].slice(0, 2).forEach((x) => lines.push(`• ${x}`));
    }
  });

  if (topic === "heat" && ctx.weather && ctx.weather.source !== "default") {
    lines.push("", `Right now it's about ${ctx.weather.tempF}°F with a UV index of ${ctx.weather.uv}.`);
  }
  if (topic === "gameday" && ctx.nextEvent) {
    lines.push("", `Next up: ${ctx.nextEvent.title} on ${ctx.nextEvent.day} at ${ctx.nextEvent.time}.`);
  }
  if (keys.length === 0) {
    lines.push("", "Tip: add support needs in the Profile tab and I'll tailor this to your child.");
  }
  lines.push("", "Want me to go deeper on any of this?");
  return lines.join("\n");
}

function buildChatContext(profile, weather, nextEvent) {
  const needs = [...profile.support].map((k) => SUPPORT_OPTIONS.find((o) => o.key === k)?.label).filter(Boolean);
  const parts = [
    `Sport: ${profile.sport}.`,
    needs.length ? `Support needs: ${needs.join("; ")}.` : "No specific support needs were selected.",
  ];
  if (weather && weather.source !== "default") parts.push(`Current weather: ${weather.tempF}F, UV ${weather.uv}.`);
  if (nextEvent) parts.push(`Next event: ${nextEvent.title}, ${nextEvent.day} at ${nextEvent.time}.`);
  return parts.join(" ");
}

async function askAI(messages, context) {
  const history = messages.map((m) => ({ role: m.role, content: m.text })).slice(-12);
  while (history.length && history[0].role !== "user") history.shift();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  try {
    if (CHAT_API_URL) {
      const res = await fetch(CHAT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, messages: history }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`Proxy returned ${res.status}`);
      const data = await res.json();
      if (!data.reply) throw new Error("Proxy sent an empty reply");
      return data.reply;
    }

    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.6,
        max_tokens: 500,
        messages: [{ role: "system", content: `${AI_SYSTEM_PROMPT}\n\nAthlete context: ${context}` }, ...history],
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`Groq returned ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error("Groq sent an empty reply");
    return reply;
  } finally {
    clearTimeout(timer);
  }
}

function ChatScreen({ p, profile, weather, nextEvent }) {
  const keys = [...profile.support];
  const who = profile.name || "your athlete";
  const greeting = keys.length
    ? `Hi! I'm your SportsSteps parent assistant. I'll tailor my advice for ${who} using the support needs in your profile (${keys.map((k) => SUPPORT_SHORT[k]).join(", ")}). Ask me about game-day prep, routines, or talking with coaches.`
    : "Hi! I'm your SportsSteps parent assistant. Ask me about game-day prep, hydration, food, weather, or working with coaches. Add support needs in the Profile tab and I'll personalize my advice.";

  const [messages, setMessages] = useState([{ role: "assistant", text: greeting }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, loading]);

  const prompts = [
    ...keys.map((k) => SUPPORT_PROMPTS[k]).filter(Boolean),
    "What should my child eat before a game?",
    "How do I handle game-day nerves?",
  ].slice(0, 4);

  const send = async (raw) => {
    const text = (raw ?? input).trim();
    if (!text || loading) return;
    setInput("");
    const next = [...messages, { role: "user", text }];
    setMessages(next);
    setLoading(true);

    let reply;
    if (AI_ON) {
      try {
        reply = await askAI(next, buildChatContext(profile, weather, nextEvent));
      } catch (err) {
        console.error("Parent AI request failed:", err);
        reply = localReply(text, profile, { weather, nextEvent }) + "\n\n(The AI service couldn't be reached, so this is built-in guidance.)";
      }
    } else {
      await new Promise((r) => setTimeout(r, 450));
      reply = localReply(text, profile, { weather, nextEvent });
    }
    setMessages((m) => [...m, { role: "assistant", text: reply }]);
    setLoading(false);
  };

  return (
    <div className="fade-in">
      <PageHeader p={p} title="Parent AI" subtitle="Personal guidance for parents, adapted to your athlete's needs" />

      <div style={{ maxWidth: 760 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontFamily: body, fontSize: 12, fontWeight: 800, color: p.inkFaint }}>Tailored for:</span>
          {keys.length === 0 ? (
            <span style={{ fontFamily: body, fontSize: 12, color: p.inkFaint }}>General guidance (add support needs in Profile)</span>
          ) : keys.map((k) => {
            const o = SUPPORT_OPTIONS.find((x) => x.key === k);
            return (
              <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: p.primarySoft, color: p.primary, borderRadius: 999, padding: "5px 11px", fontFamily: body, fontWeight: 800, fontSize: 12 }}>
                <span>{o?.icon}</span> {SUPPORT_SHORT[k]}
              </span>
            );
          })}
        </div>

        <Card p={p} style={{ padding: 0, overflow: "hidden" }}>
          <div ref={listRef} style={{ display: "flex", flexDirection: "column", gap: 12, padding: 18, minHeight: 300, maxHeight: "min(52vh, 480px)", overflowY: "auto" }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 10, justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                {m.role === "assistant" && (
                  <div style={{ width: 30, height: 30, borderRadius: 10, background: p.primarySoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Bot size={16} color={p.primary} />
                  </div>
                )}
                <div style={{
                  maxWidth: "82%", padding: "11px 14px", borderRadius: 16,
                  background: m.role === "user" ? p.primary : p.bg,
                  color: m.role === "user" ? p.onBrand : p.ink,
                  border: m.role === "user" ? "none" : `1px solid ${p.line}`,
                  fontFamily: body, fontSize: 13.5, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word",
                }}>{m.text}</div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: p.inkFaint, fontFamily: body, fontSize: 12.5, fontWeight: 700 }}>
                <RefreshCw size={14} className="spin" /> Thinking…
              </div>
            )}
          </div>

          {messages.length <= 1 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "0 18px 14px" }}>
              {prompts.map((q) => (
                <button key={q} onClick={() => send(q)} style={{ textAlign: "left", background: p.card, border: `1px solid ${p.line}`, borderRadius: 14, padding: "8px 12px", fontFamily: body, fontWeight: 700, fontSize: 12.5, color: p.ink, cursor: "pointer" }}>{q}</button>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, padding: 14, borderTop: `1px solid ${p.line}`, background: p.card }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              placeholder="Ask about prep, routines, coaches…"
              aria-label="Message the parent assistant"
              maxLength={500}
              style={{ flex: 1, padding: "13px 16px", borderRadius: 14, border: `1px solid ${p.line}`, background: p.bg, fontFamily: body, fontSize: 14, color: p.ink }}
            />
            <button onClick={() => send()} disabled={loading || !input.trim()} aria-label="Send" style={{ width: 48, flexShrink: 0, border: "none", borderRadius: 14, background: p.primary, opacity: loading || !input.trim() ? 0.5 : 1, cursor: loading || !input.trim() ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Send size={18} color={p.onBrand} />
            </button>
          </div>
        </Card>

        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 14 }}>
          <ShieldCheck size={16} color={p.inkFaint} style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontFamily: body, fontSize: 11.5, color: p.inkFaint, margin: 0, lineHeight: 1.6 }}>
            {AI_ON ? "AI can make mistakes. " : "Built-in guidance mode. "}
            This is general information, not medical advice. Check with your child's doctor for health decisions, and call 911 in an emergency.
            Chats aren't saved, and your athlete's name is never sent to the AI.
          </p>
        </div>
      </div>
    </div>
  );
}

function ProfileScreen({ p, profile, setProfile, theme, onThemeManualChange, onRestart }) {
  const toggleSupport = (key) => {
    const next = new Set(profile.support);
    next.has(key) ? next.delete(key) : next.add(key);
    setProfile({ ...profile, support: next });
  };

  return (
    <div className="fade-in">
      <PageHeader p={p} title="Profile" subtitle="Only what's needed" />
      <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 560 }}>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: p.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: p.onBrand, flexShrink: 0 }}>
            {(profile.name || "A")[0].toUpperCase()}
          </div>
          <div>
            <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Your name" style={{ border: "none", background: "none", fontFamily: body, fontWeight: 800, fontSize: 16, color: p.ink, padding: 0, width: 200 }} />
            <p style={{ fontFamily: body, fontSize: 12.5, color: p.inkFaint, margin: "2px 0 0" }}>{profile.sport}</p>
          </div>
        </div>

        <div>
          <p style={{ fontFamily: body, fontSize: 12.5, fontWeight: 800, color: p.inkFaint, margin: "0 0 8px" }}>Sport</p>
          <select value={profile.sport} onChange={(e) => setProfile({ ...profile, sport: e.target.value })} style={{ width: "100%", maxWidth: 300, padding: "12px 14px", borderRadius: 14, border: `1px solid ${p.line}`, background: p.card, fontFamily: body, fontSize: 14, fontWeight: 700, color: p.ink }}>
            {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <p style={{ fontFamily: body, fontSize: 12.5, fontWeight: 800, color: p.inkFaint, margin: "0 0 8px" }}>Theme</p>
          <ThemeSwatches p={p} current={theme} onSelect={onThemeManualChange} />
        </div>

        <div>
          <p style={{ fontFamily: body, fontSize: 12.5, fontWeight: 800, color: p.inkFaint, margin: "0 0 8px" }}>Support needs</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 8 }}>
            {SUPPORT_OPTIONS.map((o) => {
              const active = profile.support.has(o.key);
              return (
                <button key={o.key} onClick={() => toggleSupport(o.key)} style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left", cursor: "pointer", background: active ? p.primarySoft : p.card, border: `1px solid ${active ? p.primary : p.line}`, borderRadius: 16, padding: "12px 14px" }}>
                  <span style={{ fontSize: 18 }}>{o.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: body, fontWeight: 700, fontSize: 13, color: p.ink, margin: 0 }}>{o.label}</p>
                    <p style={{ fontFamily: body, fontSize: 10.5, color: p.inkFaint, margin: "1px 0 0" }}>{o.hint}</p>
                  </div>
                  {active && <Check size={16} color={p.primary} />}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p style={{ fontFamily: body, fontSize: 12.5, fontWeight: 800, color: p.inkFaint, margin: "0 0 8px" }}>Send reminders by</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 320 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: p.card, border: `1px solid ${p.line}`, borderRadius: 16, padding: "13px 16px" }}>
              <MessageSquare size={17} color={p.primary} />
              <span style={{ flex: 1, fontFamily: body, fontWeight: 700, fontSize: 14, color: p.ink }}>Text</span>
              <Switch p={p} value={profile.channels.text} onChange={() => setProfile({ ...profile, channels: { ...profile.channels, text: !profile.channels.text } })} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: p.card, border: `1px solid ${p.line}`, borderRadius: 16, padding: "13px 16px" }}>
              <Mail size={17} color={p.primary} />
              <span style={{ flex: 1, fontFamily: body, fontWeight: 700, fontSize: 14, color: p.ink }}>Email</span>
              <Switch p={p} value={profile.channels.email} onChange={() => setProfile({ ...profile, channels: { ...profile.channels, email: !profile.channels.email } })} />
            </div>
          </div>
          <p style={{ fontFamily: body, fontSize: 10.5, color: p.inkFaint, marginTop: 6, lineHeight: 1.4, maxWidth: 400 }}>
            These are saved preferences. Actually sending texts/emails needs a small backend (e.g. Twilio or SendGrid) — the in-browser notification above works right now, no server needed.
          </p>
        </div>

        <button onClick={onRestart} style={{ background: "none", border: `1px dashed ${p.line}`, borderRadius: 14, padding: "12px 0", fontFamily: body, fontWeight: 700, fontSize: 13, color: p.inkFaint, cursor: "pointer", maxWidth: 260 }}>
          Restart setup &amp; clear saved data
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  ABOUT US — edit this section to update the About tab.                 */
/*  Type your bio between the backticks. Line breaks are kept as-is.      */
/*  Photos live in /public/about/ (swap the files to change the images).  */
/* ---------------------------------------------------------------------- */

const ABOUT_PEOPLE = [
  {
    name: "Yash Nallabothula",         
    photo: "image0.jpg",
    bio: `Type your bio here. Tell people who you are, what sports you play, and why you helped build SportsSteps.`,
  },
  {
    name: "Ananya Soraganvi",           
    photo: "IMG_7245.jpg",
    bio: `Type her bio here. Tell people who she is, what she loves about sports, and why she helped build SportsSteps.`,
  },
];

const APP_PURPOSE = {
  title: "Why SportsSteps exists",
  body: [
    "SportsSteps is a prep companion for student athletes. It takes the guesswork out of game day by keeping hydration, food timing, weather, and gear checklists in one simple place.",
    "Every athlete prepares differently. That's why SportsSteps has built-in support for autism, ADHD, mobility, visual, hearing, and chronic-condition needs, with themes, reminders, and resources that adapt to you.",
    "Our goal is simple: help every student athlete feel prepared, confident, and included, so they can focus on the game.",
  ],
};

/* ---------------------------------------------------------------------- */
/*  App shell                                                              */
/* ---------------------------------------------------------------------- */

const TABS = [
  { id: "home", label: "Home", icon: Home },
  { id: "calendar", label: "Calendar", icon: CalendarIcon },
  { id: "prep", label: "Prep", icon: Droplet },
  { id: "nearby", label: "Nearby", icon: MapPin },
  { id: "chat", label: "Parent AI", icon: Bot },
  { id: "profile", label: "Profile", icon: User },
];

function SportsStepsApp({ onExit }) {
  const saved = typeof window !== "undefined" ? loadSaved() : null;

  const [stage, setStage] = useState(saved?.profile?.name ? "app" : "onboard");
  const [onboardStep, setOnboardStep] = useState(0);
  const [activeTab, setActiveTab] = useState("home");

  const [profile, setProfile] = useState(() =>
    saved?.profile
      ? { ...saved.profile, support: new Set(saved.profile.support || []) }
      : { name: "", sport: SPORTS[0], support: new Set(), channels: { text: true, email: false } }
  );
  const [theme, setTheme] = useState(saved?.theme || "vivid");
  const [themeTouched, setThemeTouched] = useState(!!saved?.theme);
  const [events, setEvents] = useState(saved?.events || DEFAULT_EVENTS);
  const [checklist, setChecklist] = useState(saved?.checklist || DEFAULT_CHECKLIST);
  const [hydration, setHydration] = useState(saved?.hydration ?? 16);

  const goal = 64;
  const [prepMode, setPrepMode] = useState("pre");
  const [showInfo, setShowInfo] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const [weather, setWeather] = useState({ tempF: 98, uv: 7, loading: false, error: null, source: "default" });
  const [notif, setNotif] = useState({ permission: typeof Notification !== "undefined" ? Notification.permission : "unsupported" });

  const p = PALETTES[theme] || PALETTES.vivid;

  useEffect(() => {
    saveState({ profile: { ...profile, support: [...profile.support] }, theme, events, checklist, hydration });
  }, [profile, theme, events, checklist, hydration]);

  const toggleItem = (i) => {
    setChecklist((prev) => {
      const next = prev.map((it, idx) => idx === i ? { ...it, done: !it.done } : it);
      if (next.length && next.every((it) => it.done)) {
        setCelebrate(true);
        setTimeout(() => setCelebrate(false), 1200);
      }
      return next;
    });
  };
  const addWater = () => setHydration((h) => Math.min(goal + 16, h + 8));
  const addEvent = (e) => setEvents((prev) => [...prev, e]);
  const deleteEvent = (id) => setEvents((prev) => prev.filter((e) => e.id !== id));

  const fetchWeather = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setWeather((w) => ({ ...w, error: "Location isn't available in this browser." }));
      return;
    }
    setWeather((w) => ({ ...w, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&daily=uv_index_max&temperature_unit=fahrenheit&timezone=auto`;
          const res = await fetch(url);
          const data = await res.json();
          const tempF = Math.round(data?.current?.temperature_2m ?? 98);
          const uv = Math.round(data?.daily?.uv_index_max?.[0] ?? 7);
          setWeather({ tempF, uv, loading: false, error: null, source: "live" });
        } catch {
          setWeather((w) => ({ ...w, loading: false, error: "Couldn't reach the weather service." }));
        }
      },
      () => setWeather((w) => ({ ...w, loading: false, error: "Location permission denied." })),
      { timeout: 8000 }
    );
  };

  const requestNotif = () => {
    if (typeof Notification === "undefined") { setNotif({ permission: "unsupported" }); return; }
    Notification.requestPermission().then((perm) => setNotif({ permission: perm }));
  };
  const sendReminder = () => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const ev = events[0];
    const body = ev
      ? `${ev.title} at ${ev.time}. ${weather.tempF}°F, UV ${weather.uv}. Pack water, sunscreen, and gear.`
      : "Time to prep for your next event.";
    new Notification("SportsSteps", { body });
  };

  const restart = () => {
    clearSaved();
    setStage("welcome");
    setOnboardStep(0);
    setProfile({ name: "", sport: SPORTS[0], support: new Set(), channels: { text: true, email: false } });
    setTheme("vivid");
    setThemeTouched(false);
    setEvents(DEFAULT_EVENTS);
    setChecklist(DEFAULT_CHECKLIST);
    setHydration(16);
  };

  const toggleSupport = (key) => {
    const next = new Set(profile.support);
    next.has(key) ? next.delete(key) : next.add(key);
    setProfile({ ...profile, support: next });
  };

  const advanceFromSupportStep = () => {
    if (!themeTouched) setTheme(suggestedTheme(profile.support));
    setOnboardStep(3);
  };

  const finishOnboarding = () => {
    if (profile.support.has("mobility")) {
      setChecklist((prev) => prev.some((i) => i.label === "Mobility aid") ? prev : [...prev, { label: "Mobility aid", emoji: "♿", done: false }]);
    }
    if (profile.support.has("chronic")) {
      setChecklist((prev) => prev.some((i) => i.label === "Medication") ? prev : [...prev, { label: "Medication", emoji: "💊", done: false }]);
    }
    setStage("app");
  };

  const ONBOARD_STEPS = 4;

  if (stage === "welcome") {
    return (
      <div style={{ minHeight: "100vh" }}>
        <GlobalStyle />
        <WelcomeScreen p={p} onStart={() => setStage("onboard")} />
      </div>
    );
  }

  if (stage === "onboard") {
    return (
      <div style={{ minHeight: "100vh", background: p.bg, display: "flex", justifyContent: "center", padding: "48px 20px" }}>
        <GlobalStyle />
        <div style={{ width: "100%", maxWidth: 480 }}>
          <button onClick={onExit} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "0 0 14px", fontFamily: body, fontSize: 12.5, fontWeight: 800, color: p.inkFaint }}>
            <ChevronLeft size={14} /> Back to website
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28, justifyContent: "center" }}>
            <div style={{ width: 30, height: 30, borderRadius: 11, background: p.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🏆</div>
            <span style={{ fontFamily: display, fontSize: 17, fontWeight: 800, color: p.ink }}>SportsSteps</span>
          </div>

          <div style={{ background: p.card, border: `1px solid ${p.line}`, borderRadius: 26, padding: "28px 28px 24px", boxShadow: "0 20px 45px -25px rgba(20,25,45,0.25)" }}>
            <ProgressDots p={p} step={onboardStep} total={ONBOARD_STEPS} />

            {onboardStep === 0 && (
              <OnboardStepShell p={p} title="What should we call you?" sub="First name is plenty." showBack={false} onNext={() => setOnboardStep(1)}>
                <input autoFocus value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Your name" style={{ width: "100%", padding: "14px 16px", borderRadius: 16, border: `1px solid ${p.line}`, background: p.bg, fontFamily: body, fontSize: 15, color: p.ink }} />
              </OnboardStepShell>
            )}

            {onboardStep === 1 && (
              <OnboardStepShell p={p} title="Pick your sport" sub="You can change this any time." onBack={() => setOnboardStep(0)} onNext={() => setOnboardStep(2)}>
                <select value={profile.sport} onChange={(e) => setProfile({ ...profile, sport: e.target.value })} style={{ width: "100%", padding: "14px 16px", borderRadius: 16, border: `1px solid ${p.line}`, background: p.bg, fontFamily: body, fontSize: 15, fontWeight: 700, color: p.ink }}>
                  {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </OnboardStepShell>
            )}

            {onboardStep === 2 && (
              <OnboardStepShell p={p} title="Any support we should know about?" sub="Totally optional — pick as many as apply." onBack={() => setOnboardStep(1)} onNext={advanceFromSupportStep}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {SUPPORT_OPTIONS.map((o) => {
                    const active = profile.support.has(o.key);
                    return (
                      <button key={o.key} onClick={() => toggleSupport(o.key)} style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left", cursor: "pointer", background: active ? p.primarySoft : p.bg, border: `1px solid ${active ? p.primary : p.line}`, borderRadius: 16, padding: "12px 14px" }}>
                        <span style={{ fontSize: 18 }}>{o.icon}</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontFamily: body, fontWeight: 700, fontSize: 13.5, color: p.ink, margin: 0 }}>{o.label}</p>
                          <p style={{ fontFamily: body, fontSize: 11, color: p.inkFaint, margin: "1px 0 0" }}>{o.hint}</p>
                        </div>
                        {active && <Check size={16} color={p.primary} />}
                      </button>
                    );
                  })}
                </div>
              </OnboardStepShell>
            )}

            {onboardStep === 3 && (
              <OnboardStepShell p={p} title="Pick a look and how to hear from us" sub="We've suggested a theme based on what you picked — change it any time." onBack={() => setOnboardStep(2)} onNext={finishOnboarding} nextLabel="Finish">
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <ThemeSwatches p={p} current={theme} onSelect={(k) => { setTheme(k); setThemeTouched(true); }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, background: p.bg, border: `1px solid ${p.line}`, borderRadius: 16, padding: "13px 16px" }}>
                      <MessageSquare size={17} color={p.primary} />
                      <span style={{ flex: 1, fontFamily: body, fontWeight: 700, fontSize: 14, color: p.ink }}>Text</span>
                      <Switch p={p} value={profile.channels.text} onChange={() => setProfile({ ...profile, channels: { ...profile.channels, text: !profile.channels.text } })} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, background: p.bg, border: `1px solid ${p.line}`, borderRadius: 16, padding: "13px 16px" }}>
                      <Mail size={17} color={p.primary} />
                      <span style={{ flex: 1, fontFamily: body, fontWeight: 700, fontSize: 14, color: p.ink }}>Email</span>
                      <Switch p={p} value={profile.channels.email} onChange={() => setProfile({ ...profile, channels: { ...profile.channels, email: !profile.channels.email } })} />
                    </div>
                  </div>
                </div>
              </OnboardStepShell>
            )}
          </div>
        </div>
      </div>
    );
  }

  // stage === "app"
  const nextEvent = events[0];
  const screens = {
    home: <HomeScreen p={p} profile={profile} checklist={checklist} toggleItem={toggleItem} hydration={hydration} goal={goal} showInfo={showInfo} setShowInfo={setShowInfo} celebrate={celebrate} streak={3} nextEvent={nextEvent} weather={weather} fetchWeather={fetchWeather} notif={notif} requestNotif={requestNotif} sendReminder={sendReminder} addWater={addWater} />,
    calendar: <CalendarScreen p={p} events={events} addEvent={addEvent} deleteEvent={deleteEvent} />,
    prep: <PrepScreen p={p} mode={prepMode} setMode={setPrepMode} hydration={hydration} goal={goal} addWater={addWater} profile={profile} />,
    nearby: <NearbyScreen p={p} profile={profile} />,
    chat: <ChatScreen p={p} profile={profile} weather={weather} nextEvent={nextEvent} />,
    profile: <ProfileScreen p={p} profile={profile} setProfile={setProfile} theme={theme} onThemeManualChange={(k) => { setTheme(k); setThemeTouched(true); }} onRestart={restart} />,
  };

  return (
    <div style={{ background: p.bg, minHeight: "100vh" }}>
      <GlobalStyle />
      <div className="app-shell">
        <aside className="sidebar-nav" style={{ background: p.card, borderRight: `1px solid ${p.line}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px 24px" }}>
            <div style={{ width: 30, height: 30, borderRadius: 11, background: p.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🏆</div>
            <span style={{ fontFamily: display, fontSize: 16, fontWeight: 800, color: p.ink }}>SportsSteps</span>
          </div>
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14,
                background: active ? p.primarySoft : "transparent", border: "none", cursor: "pointer", textAlign: "left",
              }}>
                <Icon size={18} color={active ? p.primary : p.inkFaint} />
                <span style={{ fontFamily: body, fontWeight: 700, fontSize: 14, color: active ? p.primary : p.ink }}>{t.label}</span>
              </button>
            );
          })}
        </aside>

        <main className="main-content">
          <div className="content-max">
            <button onClick={onExit} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "0 0 14px", fontFamily: body, fontSize: 12.5, fontWeight: 800, color: p.inkFaint }}>
              <ChevronLeft size={14} /> Back to website
            </button>
            {screens[activeTab]}
          </div>
        </main>
      </div>

      <nav className="bottom-tabbar" style={{ position: "sticky", bottom: 0, background: p.card, borderTop: `1px solid ${p.line}`, justifyContent: "space-around", padding: "10px 4px 14px" }}>
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "5px 8px", borderRadius: 12 }}>
              <div style={{ width: 36, height: 28, borderRadius: 10, background: active ? p.primarySoft : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={18} color={active ? p.primary : p.inkFaint} />
              </div>
              <span style={{ fontFamily: body, fontSize: 9.5, fontWeight: 800, color: active ? p.primary : p.inkFaint }}>{t.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  LANDING PAGE — edit the text below to change the website copy.        */
/* ---------------------------------------------------------------------- */

const LANDING = {
  badge: "Congressional App Challenge Entry",
  headline: "Prep like a pro,",
  headlineAccent: "no matter how you play.",
  subhead: "SportsSteps helps student athletes get ready for every practice, match, and tournament — hydration, food timing, weather, and gear, all in one place. And it adapts to each athlete's needs.",
  footer: "Built by students, for student athletes.",
};

const LANDING_FEATURES = [
  { emoji: "💧", title: "Hydration tracking", body: "Log water in one tap and watch your daily goal fill up before practice, a match, or a tournament." },
  { emoji: "🍌", title: "Food timing", body: "Simple pre- and post-game fuel ideas, so you always know what to eat and when." },
  { emoji: "☀️", title: "Live weather & UV", body: "Real temperature and UV index for your location, so heat and sun never catch you off guard." },
  { emoji: "🎒", title: "Gear checklists", body: "A quick checklist for your bottle, sunscreen, and equipment, with a little celebration when you're all set." },
  { emoji: "🔔", title: "Smart reminders", body: "Real browser notifications with a summary of today's prep, right when you need it." },
  { emoji: "🗓️", title: "Game calendar", body: "Add practices, matches, and tournaments and see what's coming up at a glance." },
];

const LANDING_STEPS = [
  { n: "1", title: "Tell us about you", body: "Your name, your sport, and any support you'd like. It takes under a minute." },
  { n: "2", title: "Get a plan that fits", body: "SportsSteps picks a theme, reminders, and resources that match your needs." },
  { n: "3", title: "Show up ready", body: "Check off your list, hit your hydration goal, and focus on the game." },
];

function HeroPreview({ p }) {
  const items = [
    { emoji: "💧", label: "Water bottle", done: true },
    { emoji: "🧴", label: "Sunscreen", done: true },
    { emoji: "🎒", label: "Equipment", done: false },
  ];
  return (
    <div className="float" style={{ background: p.card, border: `1px solid ${p.line}`, borderRadius: 28, padding: 22, boxShadow: "0 30px 60px -30px rgba(20,25,45,0.35)", maxWidth: 380, width: "100%", justifySelf: "center" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <p style={{ fontFamily: body, fontSize: 11.5, fontWeight: 800, color: p.inkFaint, margin: 0 }}>TODAY'S PREP</p>
          <p style={{ fontFamily: display, fontSize: 20, fontWeight: 800, color: p.ink, margin: "2px 0 0" }}>Match at 5:00 PM</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: p.accentSoft, color: p.accent, borderRadius: 12, padding: "6px 10px", fontFamily: body, fontWeight: 800, fontSize: 12 }}>
          <Sun size={13} /> 98°F · UV 7
        </div>
      </div>

      <div style={{ background: p.primarySoft, borderRadius: 18, padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: body, fontWeight: 800, fontSize: 13, color: p.primary }}><Droplet size={15} /> Hydration</span>
          <span style={{ fontFamily: body, fontWeight: 800, fontSize: 12.5, color: p.ink }}>32 / 64 oz</span>
        </div>
        <div style={{ height: 8, borderRadius: 6, background: p.card }}>
          <div style={{ width: "50%", height: "100%", borderRadius: 6, background: p.primary }} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((it) => (
          <div key={it.label} style={{ display: "flex", alignItems: "center", gap: 12, background: p.bg, border: `1px solid ${p.line}`, borderRadius: 14, padding: "10px 12px" }}>
            <span style={{ fontSize: 18 }}>{it.emoji}</span>
            <span style={{ flex: 1, fontFamily: body, fontWeight: 700, fontSize: 13.5, color: p.ink, textDecoration: it.done ? "line-through" : "none", opacity: it.done ? 0.6 : 1 }}>{it.label}</span>
            <div style={{ width: 22, height: 22, borderRadius: 7, background: it.done ? p.good : "transparent", border: it.done ? "none" : `2px solid ${p.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {it.done && <Check size={14} color={p.onBrand} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ p, eyebrow, title, sub }) {
  return (
    <div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 32px" }}>
      {eyebrow && <p style={{ fontFamily: body, fontSize: 12, fontWeight: 800, letterSpacing: 1, color: p.primary, margin: "0 0 8px", textTransform: "uppercase" }}>{eyebrow}</p>}
      <h2 style={{ fontFamily: display, fontSize: "clamp(26px, 3.6vw, 36px)", fontWeight: 800, color: p.ink, margin: 0, lineHeight: 1.15 }}>{title}</h2>
      {sub && <p style={{ fontFamily: body, fontSize: 15, color: p.inkFaint, margin: "10px 0 0", lineHeight: 1.6 }}>{sub}</p>}
    </div>
  );
}

function LandingHome({ p, onStart, onAbout, startLabel }) {
  return (
    <div className="fade-in">
      <div className="land-wrap">
        <section className="land-hero">
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: p.primarySoft, color: p.primary, borderRadius: 999, padding: "7px 14px", fontFamily: body, fontWeight: 800, fontSize: 12.5, marginBottom: 20 }}>
              <Sparkles size={14} /> {LANDING.badge}
            </div>
            <h1 className="land-h1" style={{ fontFamily: display, fontWeight: 800, color: p.ink, margin: 0 }}>
              {LANDING.headline}{" "}
              <span style={{ color: p.primary }}>{LANDING.headlineAccent}</span>
            </h1>
            <p style={{ fontFamily: body, fontSize: 17, color: p.inkFaint, lineHeight: 1.65, margin: "18px 0 0", maxWidth: 520 }}>{LANDING.subhead}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 28 }}>
              <button onClick={onStart} className="land-btn pulse-ring" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: p.primary, color: p.onBrand, border: "none", borderRadius: 16, padding: "15px 28px", fontFamily: body, fontWeight: 800, fontSize: 16, cursor: "pointer" }}>
                {startLabel} <ChevronRight size={19} />
              </button>
              <button onClick={onAbout} className="land-btn" style={{ background: p.card, color: p.ink, border: `1px solid ${p.line}`, borderRadius: 16, padding: "15px 24px", fontFamily: body, fontWeight: 800, fontSize: 16, cursor: "pointer" }}>
                Meet the team
              </button>
            </div>
            <p style={{ fontFamily: body, fontSize: 12.5, color: p.inkFaint, marginTop: 16 }}>Free · No account needed · Works in your browser</p>
          </div>
          <HeroPreview p={p} />
        </section>
      </div>

      <section style={{ padding: "24px 0 56px" }}>
        <div className="land-wrap">
          <SectionTitle p={p} eyebrow="Features" title="Everything you need before game time" sub="Hydration, food, weather, gear, and your schedule, all handled in one simple app." />
          <div className="land-grid3">
            {LANDING_FEATURES.map((f) => (
              <Card key={f.title} p={p} className="land-card" style={{ padding: 22 }}>
                <div style={{ width: 46, height: 46, borderRadius: 15, background: p.primarySoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 14 }}>{f.emoji}</div>
                <p style={{ fontFamily: display, fontSize: 18, fontWeight: 800, color: p.ink, margin: 0 }}>{f.title}</p>
                <p style={{ fontFamily: body, fontSize: 13.5, color: p.inkFaint, margin: "6px 0 0", lineHeight: 1.6 }}>{f.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "56px 0", background: p.card, borderTop: `1px solid ${p.line}`, borderBottom: `1px solid ${p.line}` }}>
        <div className="land-wrap">
          <SectionTitle p={p} eyebrow="Inclusive by design" title="Built for every athlete" sub="Tell SportsSteps what support helps you and it adapts its look, reminders, and community resources. Choose from four themes: Vivid, Calm, Dark, and High Contrast." />
          <div className="land-grid3">
            {SUPPORT_OPTIONS.map((o) => (
              <div key={o.key} style={{ display: "flex", alignItems: "center", gap: 14, background: p.bg, border: `1px solid ${p.line}`, borderRadius: 18, padding: "16px 18px" }}>
                <span style={{ fontSize: 26 }}>{o.icon}</span>
                <div>
                  <p style={{ fontFamily: body, fontWeight: 800, fontSize: 14, color: p.ink, margin: 0 }}>{o.label}</p>
                  <p style={{ fontFamily: body, fontSize: 12, color: p.inkFaint, margin: "2px 0 0" }}>{o.hint}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "56px 0" }}>
        <div className="land-wrap">
          <SectionTitle p={p} eyebrow="How it works" title="Ready in three steps" />
          <div className="land-grid3">
            {LANDING_STEPS.map((st) => (
              <Card key={st.n} p={p} style={{ padding: 22 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: p.primary, color: p.onBrand, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: display, fontWeight: 800, fontSize: 18, marginBottom: 12 }}>{st.n}</div>
                <p style={{ fontFamily: display, fontSize: 18, fontWeight: 800, color: p.ink, margin: 0 }}>{st.title}</p>
                <p style={{ fontFamily: body, fontSize: 13.5, color: p.inkFaint, margin: "6px 0 0", lineHeight: 1.6 }}>{st.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "0 0 64px" }}>
        <div className="land-wrap">
          <div style={{ background: p.primary, borderRadius: 28, padding: "44px 28px", textAlign: "center" }}>
            <h2 style={{ fontFamily: display, fontSize: "clamp(26px, 3.6vw, 36px)", fontWeight: 800, color: p.onBrand, margin: 0 }}>Ready to step up your prep?</h2>
            <p style={{ fontFamily: body, fontSize: 15.5, color: p.onBrand, opacity: 0.9, margin: "10px auto 22px", maxWidth: 460, lineHeight: 1.6 }}>Set up takes under a minute, and there's nothing to download.</p>
            <button onClick={onStart} className="land-btn" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: p.card, color: p.primary, border: "none", borderRadius: 16, padding: "15px 30px", fontFamily: body, fontWeight: 800, fontSize: 16, cursor: "pointer" }}>
              {startLabel} <ChevronRight size={19} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function LandingPage({ p, onStart, startLabel }) {
  const [tab, setTab] = useState("home");

  useEffect(() => { window.scrollTo({ top: 0 }); }, [tab]);

  const navTabs = [
    { id: "home", label: "Home", icon: Home },
    { id: "about", label: "About Us", icon: Info },
  ];

  return (
    <div style={{ background: p.bg, minHeight: "100vh" }}>
      <GlobalStyle />
      <header style={{ position: "sticky", top: 0, zIndex: 20, background: p.card, borderBottom: `1px solid ${p.line}` }}>
        <div className="land-wrap" style={{ display: "flex", alignItems: "center", gap: 6, height: 66 }}>
          <button onClick={() => setTab("home")} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: 0, marginRight: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 11, background: p.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏆</div>
            <span className="land-logo-text" style={{ fontFamily: display, fontSize: 18, fontWeight: 800, color: p.ink }}>SportsSteps</span>
          </button>

          {navTabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} className="land-tab" onClick={() => setTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 12, background: active ? p.primarySoft : "transparent", border: "none", cursor: "pointer" }}>
                <Icon size={16} color={active ? p.primary : p.inkFaint} />
                <span style={{ fontFamily: body, fontWeight: 800, fontSize: 14, color: active ? p.primary : p.ink }}>{t.label}</span>
              </button>
            );
          })}

          <div style={{ flex: 1 }} />

          <button onClick={onStart} className="land-btn land-cta" style={{ display: "flex", alignItems: "center", gap: 6, background: p.primary, color: p.onBrand, border: "none", borderRadius: 13, padding: "10px 16px", fontFamily: body, fontWeight: 800, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap" }}>
            {startLabel} <ChevronRight size={16} />
          </button>
        </div>
      </header>

      {tab === "home" && <LandingHome p={p} onStart={onStart} onAbout={() => setTab("about")} startLabel={startLabel} />}
      {tab === "about" && (
        <div className="land-wrap fade-in" style={{ padding: "40px 24px 64px" }}>
         <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <AboutScreen p={p} />
          <div style={{ marginTop: 24, textAlign: "center" }}>
            <button onClick={onStart} className="land-btn" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: p.primary, color: p.onBrand, border: "none", borderRadius: 16, padding: "14px 26px", fontFamily: body, fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
              {startLabel} <ChevronRight size={18} />
            </button>
          </div>
         </div>
        </div>
      )}

      <footer style={{ borderTop: `1px solid ${p.line}`, padding: "22px 0 28px", textAlign: "center" }}>
        <p style={{ fontFamily: body, fontSize: 12.5, color: p.inkFaint, margin: 0 }}>🏆 SportsSteps · {LANDING.footer}</p>
      </footer>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Site root: landing page  <->  the app                                  */
/* ---------------------------------------------------------------------- */

export default function Site() {
  const [view, setView] = useState("site");
  const [siteTheme, setSiteTheme] = useState(() => loadSaved()?.theme || "vivid");
  const returning = !!loadSaved()?.profile?.name;

  useEffect(() => { window.scrollTo({ top: 0 }); }, [view]);

  if (view === "app") {
    return (
      <SportsStepsApp
        onExit={() => {
          setSiteTheme(loadSaved()?.theme || "vivid");
          setView("site");
        }}
      />
    );
  }

  return (
    <LandingPage
      p={PALETTES[siteTheme] || PALETTES.vivid}
      onStart={() => setView("app")}
      startLabel={returning ? "Open my app" : "Let's get started"}
    />
  );
}