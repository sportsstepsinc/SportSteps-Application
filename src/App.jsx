import React, { useState, useEffect, useMemo } from "react";
import {
  Home, Calendar as CalendarIcon, Droplet, MapPin, User, Plus, Check, Trash2,
  Sun, Bell, BellOff, MessageSquare, Mail, ChevronRight, ChevronLeft, ExternalLink,
  Sparkles, Flame, ShieldCheck, RefreshCw, Users, Info,
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

function Card({ p, children, style }) {
  return <div style={{ background: p.card, border: `1px solid ${p.line}`, borderRadius: 20, padding: 20, ...style }}>{children}</div>;
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
    name: "Yash Nallabothula",            // <- change me        // <- change me
    photo: "image0.jpg",
    bio: `Type your bio here. Tell people who you are, what sports you play, and why you helped build SportsSteps.`,
  },
  {
    name: "Ananya Soraganvi",             // <- change me          // <- change me
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
  { id: "profile", label: "Profile", icon: User },
  { id: "about", label: "About", icon: Info },
];

export default function SportsStepsApp() {
  const saved = typeof window !== "undefined" ? loadSaved() : null;

  const [stage, setStage] = useState(saved?.profile?.name ? "app" : "welcome");
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
    profile: <ProfileScreen p={p} profile={profile} setProfile={setProfile} theme={theme} onThemeManualChange={(k) => { setTheme(k); setThemeTouched(true); }} onRestart={restart} />,
    about: <AboutScreen p={p} />,
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
          <div className="content-max">{screens[activeTab]}</div>
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
