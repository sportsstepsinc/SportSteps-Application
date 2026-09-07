import React, { useState, useEffect, useMemo } from "react";
import {
  Home, Calendar as CalendarIcon, Droplet, MapPin, User, Plus, Check,
  Sun, Bell, BellOff, MessageSquare, Mail, ChevronRight, ChevronLeft,
  Sparkles, Flame, ShieldCheck, RefreshCw, MapPinned,
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/*  Persistence — real localStorage, wrapped so it never crashes.         */
/*  (Works fully once this is hosted for real, e.g. on GitHub Pages.)     */
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
  } catch {
    /* storage unavailable — app still works, just won't persist */
  }
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
    onBrand: "#FFFFFF", overlay: "rgba(255,255,255,0.22)", bezel: "#0E1220",
  },
  calm: {
    label: "Calm", dot: "#6E8C75",
    bg: "#F7F6F1", card: "#FFFFFF", line: "#E7E4DA",
    ink: "#41413B", inkFaint: "#8C8B80",
    primary: "#6E8C75", primarySoft: "#E4EBE2",
    accent: "#7FA0B3", accentSoft: "#E4EDF1",
    good: "#6E8C75", goodSoft: "#E4EBE2",
    onBrand: "#FFFFFF", overlay: "rgba(255,255,255,0.22)", bezel: "#0E1220",
  },
  dark: {
    label: "Dark", dot: "#5B8CFF",
    bg: "#111422", card: "#1A1F35", line: "#2A2F49",
    ink: "#F2F4FF", inkFaint: "#9AA0C2",
    primary: "#5B8CFF", primarySoft: "#243257",
    accent: "#FF8A65", accentSoft: "#3A2A22",
    good: "#3DDC84", goodSoft: "#173323",
    onBrand: "#FFFFFF", overlay: "rgba(255,255,255,0.18)", bezel: "#000000",
  },
  highContrast: {
    label: "High Contrast", dot: "#FFD400",
    bg: "#000000", card: "#111111", line: "#FFFFFF",
    ink: "#FFFFFF", inkFaint: "#FFD400",
    primary: "#FFD400", primarySoft: "#332B00",
    accent: "#00E5FF", accentSoft: "#00343A",
    good: "#00FF7F", goodSoft: "#002B14",
    onBrand: "#000000", overlay: "rgba(0,0,0,0.18)", bezel: "#000000",
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

const NEARBY = [
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
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; }
      }
    `}</style>
  );
}

function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    left: Math.random() * 100, delay: Math.random() * 0.4,
    color: ["#2E5EFF", "#FF6B4A", "#1FAA6E", "#FFC93C"][i % 4],
  })), []);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 5 }}>
      {pieces.map((p, i) => (
        <div key={i} style={{ position: "absolute", top: 0, left: `${p.left}%`, width: 7, height: 7, background: p.color, borderRadius: 2, animation: `confettiFall 1.1s ease-out ${p.delay}s both` }} />
      ))}
    </div>
  );
}

function ThemeSwatches({ p, current, onSelect, compact }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {Object.entries(PALETTES).map(([key, pal]) => (
        <button key={key} onClick={() => onSelect(key)} style={{
          display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
          background: current === key ? p.primarySoft : p.card,
          border: `1px solid ${current === key ? p.primary : p.line}`,
          borderRadius: 14, padding: compact ? "8px 12px" : "10px 14px",
        }}>
          <span style={{ width: 16, height: 16, borderRadius: "50%", background: pal.dot, display: "block", flexShrink: 0, border: "1px solid rgba(0,0,0,0.1)" }} />
          <span style={{ fontFamily: body, fontSize: 12.5, fontWeight: 700, color: p.ink }}>{pal.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Onboarding                                                             */
/* ---------------------------------------------------------------------- */

function WelcomeScreen({ p, onStart }) {
  return (
    <div className="fade-in" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 28px", background: p.bg, height: "100%" }}>
      <div className="float" style={{ width: 92, height: 92, borderRadius: 28, background: p.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, marginBottom: 22, boxShadow: `0 16px 30px -10px ${p.primary}66` }}>🏆</div>
      <h1 style={{ fontFamily: display, fontSize: 30, fontWeight: 800, color: p.ink, textAlign: "center", margin: 0 }}>SportsSteps</h1>
      <p style={{ fontFamily: body, fontSize: 14.5, color: p.inkFaint, textAlign: "center", marginTop: 8, lineHeight: 1.5, maxWidth: 260 }}>
        Prep like a pro. Water, food, weather, and gear — sorted before you even ask.
      </p>
      <button onClick={onStart} className="pulse-ring" style={{ marginTop: 34, background: p.primary, color: p.onBrand, border: "none", borderRadius: 18, padding: "15px 34px", fontFamily: body, fontWeight: 800, fontSize: 15.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
        Get started <ChevronRight size={18} />
      </button>
      <p style={{ fontFamily: body, fontSize: 11.5, color: p.inkFaint, marginTop: 16 }}>Takes under a minute · barely any typing</p>
    </div>
  );
}

function ProgressDots({ p, step, total }) {
  return (
    <div style={{ display: "flex", gap: 6, padding: "18px 24px 4px" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: 6, borderRadius: 4, background: i <= step ? p.primary : p.line, transition: "background 0.3s ease" }} />
      ))}
    </div>
  );
}

function OnboardStepShell({ p, title, sub, children, onBack, onNext, nextLabel = "Next", showBack = true }) {
  return (
    <div className="fade-in" key={title} style={{ flex: 1, display: "flex", flexDirection: "column", padding: "8px 24px 24px", height: "100%" }}>
      <h2 style={{ fontFamily: display, fontSize: 22, fontWeight: 700, color: p.ink, margin: "10px 0 4px" }}>{title}</h2>
      {sub && <p style={{ fontFamily: body, fontSize: 13, color: p.inkFaint, margin: "0 0 18px" }}>{sub}</p>}
      <div style={{ flex: 1, overflowY: "auto" }}>{children}</div>
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        {showBack && (
          <button onClick={onBack} style={{ width: 48, flexShrink: 0, background: p.card, border: `1px solid ${p.line}`, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ChevronLeft size={18} color={p.ink} />
          </button>
        )}
        <button onClick={onNext} style={{ flex: 1, background: p.primary, color: p.onBrand, border: "none", borderRadius: 16, fontFamily: body, fontWeight: 800, fontSize: 14.5, cursor: "pointer", padding: "13px 0" }}>
          {nextLabel}
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Shared bits                                                            */
/* ---------------------------------------------------------------------- */

function TopHeader({ p, title, subtitle }) {
  return (
    <div style={{ padding: "20px 22px 6px" }}>
      <h1 style={{ fontFamily: display, fontSize: 23, color: p.ink, fontWeight: 800, margin: 0 }}>{title}</h1>
      {subtitle && <p style={{ fontFamily: body, fontSize: 12.5, color: p.inkFaint, margin: "3px 0 0" }}>{subtitle}</p>}
    </div>
  );
}

function HydrationRing({ p, pct, size = 84 }) {
  const r = 36, c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 84 84">
        <circle cx="42" cy="42" r={r} fill="none" stroke={p.accentSoft} strokeWidth="9" />
        <circle cx="42" cy="42" r={r} fill="none" stroke={p.accent} strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} transform="rotate(-90 42 42)" style={{ transition: "stroke-dashoffset 0.5s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: display, fontWeight: 800, fontSize: 16, color: p.ink }}>{pct}%</span>
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
/*  Main app screens                                                       */
/* ---------------------------------------------------------------------- */

function HomeScreen({ p, profile, checklist, toggleItem, hydration, goal, showInfo, setShowInfo, celebrate, streak, nextEvent, weather, fetchWeather, notif, requestNotif, sendReminder }) {
  const pct = Math.min(100, Math.round((hydration / goal) * 100));
  const allDone = checklist.length > 0 && checklist.every((i) => i.done);
  const hot = weather.tempF >= 90;
  const highUV = weather.uv >= 6;

  return (
    <div className="fade-in" style={{ position: "relative" }}>
      {celebrate && <Confetti />}
      <TopHeader p={p} title={`Hey, ${profile.name || "athlete"} 👋`} subtitle={`${profile.sport} · next up`} />

      <div style={{ padding: "8px 22px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Flame size={16} color={p.accent} />
          <span style={{ fontFamily: body, fontSize: 12.5, fontWeight: 700, color: p.inkFaint }}>{streak}-day prep streak</span>
        </div>

        <div style={{ background: p.primary, borderRadius: 24, padding: "18px 20px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: body, fontSize: 11.5, fontWeight: 700, color: p.onBrand, opacity: 0.8, margin: 0 }}>NEXT UP</p>
            <p style={{ fontFamily: display, fontSize: 19, fontWeight: 800, color: p.onBrand, margin: "2px 0 8px" }}>
              {nextEvent ? `${nextEvent.title} · ${nextEvent.time}` : "Nothing scheduled"}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Sun size={15} color={p.onBrand} />
              <span style={{ fontFamily: body, fontSize: 12.5, color: p.onBrand, fontWeight: 700 }}>
                {weather.loading ? "Checking…" : `${weather.tempF}°F · UV ${weather.uv}`}
              </span>
              <button onClick={() => setShowInfo(!showInfo)} style={{ marginLeft: 4, width: 22, height: 22, borderRadius: "50%", border: "none", background: p.overlay, color: p.onBrand, cursor: "pointer", fontSize: 11, fontWeight: 800 }}>i</button>
              <button onClick={fetchWeather} title="Use my real location" style={{ width: 22, height: 22, borderRadius: "50%", border: "none", background: p.overlay, color: p.onBrand, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <RefreshCw size={11} className={weather.loading ? "spin" : ""} />
              </button>
            </div>
          </div>
          <HydrationRing p={p} pct={pct} />
        </div>

        {weather.error && (
          <p style={{ fontFamily: body, fontSize: 11.5, color: p.inkFaint, margin: 0 }}>{weather.error}</p>
        )}

        {showInfo && (
          <div className="fade-in" style={{ background: p.accentSoft, borderRadius: 16, padding: "13px 16px" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              <Sparkles size={14} color={p.accent} style={{ marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontFamily: body, fontSize: 11, fontWeight: 800, color: p.accent, letterSpacing: 0.3 }}>AI PREP NOTE</span>
            </div>
            <p style={{ fontFamily: body, fontSize: 13, color: p.ink, lineHeight: 1.55, margin: 0 }}>
              {nextEvent ? `You have a ${profile.sport.toLowerCase()} ${nextEvent.title.toLowerCase()} coming up at ${nextEvent.time}. ` : ""}
              {hot ? `It'll be ${weather.tempF}°F` : `It'll be a mild ${weather.tempF}°F`}
              {highUV ? ` with a UV index of ${weather.uv}. Start hydrating tonight and pack sunscreen, electrolytes, and a cooling towel.` : `. Pack your water and gear the night before.`}
              {" "}You forgot your bag last time — it's on today's list.
            </p>
          </div>
        )}

        <p style={{ fontFamily: body, fontSize: 12.5, fontWeight: 800, color: p.inkFaint, margin: "6px 0 0" }}>Pack today</p>
        {checklist.map((item, i) => (
          <button key={item.label} onClick={() => toggleItem(i)} style={{ display: "flex", alignItems: "center", gap: 12, background: item.done ? p.goodSoft : p.card, border: `1px solid ${item.done ? p.good : p.line}`, borderRadius: 16, padding: "12px 14px", cursor: "pointer", textAlign: "left" }}>
            <span style={{ fontSize: 19 }}>{item.emoji}</span>
            <span style={{ flex: 1, fontFamily: body, fontWeight: 700, fontSize: 14, color: p.ink, opacity: item.done ? 0.55 : 1, textDecoration: item.done ? "line-through" : "none" }}>{item.label}</span>
            <div className={item.done ? "pop-in" : ""} style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, background: item.done ? p.good : p.bg, border: item.done ? "none" : `2px solid ${p.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {item.done && <Check size={14} color="#fff" strokeWidth={3} />}
            </div>
          </button>
        ))}
        {allDone && (
          <p className="pop-in" style={{ fontFamily: body, fontSize: 13, fontWeight: 800, color: p.good, textAlign: "center", margin: "4px 0 0" }}>All packed. Go get it! 🎉</p>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12, background: p.card, border: `1px solid ${p.line}`, borderRadius: 16, padding: "13px 16px", marginTop: 4 }}>
          {notif.permission === "granted" ? <Bell size={17} color={p.primary} /> : <BellOff size={17} color={p.inkFaint} />}
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: body, fontWeight: 700, fontSize: 13, color: p.ink, margin: 0 }}>
              {notif.permission === "granted" ? "Reminders on" : notif.permission === "unsupported" ? "Not supported here" : "Reminders off"}
            </p>
          </div>
          {notif.permission === "granted" ? (
            <button onClick={sendReminder} style={{ background: p.primarySoft, color: p.primary, border: "none", borderRadius: 12, padding: "7px 12px", fontFamily: body, fontWeight: 800, fontSize: 12, cursor: "pointer" }}>Send test</button>
          ) : notif.permission !== "unsupported" ? (
            <button onClick={requestNotif} style={{ background: p.primary, color: p.onBrand, border: "none", borderRadius: 12, padding: "7px 12px", fontFamily: body, fontWeight: 800, fontSize: 12, cursor: "pointer" }}>Enable</button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CalendarScreen({ p, events, addEvent }) {
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
      <TopHeader p={p} title="Calendar" subtitle="Your practices, matches, and meets" />
      <div style={{ padding: "8px 22px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
        {events.map((e) => (
          <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 14, background: p.card, border: `1px solid ${p.line}`, borderRadius: 18, padding: "14px 16px" }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: p.primarySoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{e.emoji}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: body, fontWeight: 800, fontSize: 14, color: p.ink, margin: 0 }}>{e.title}</p>
              <p style={{ fontFamily: body, fontSize: 12, color: p.inkFaint, margin: "2px 0 0" }}>{e.day} · {e.time}</p>
            </div>
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
      <TopHeader p={p} title="Prep" subtitle="Hydration and fueling, made simple" />
      <div style={{ padding: "8px 22px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ background: p.card, border: `1px solid ${p.line}`, borderRadius: 20, padding: 18, display: "flex", alignItems: "center", gap: 16 }}>
          <HydrationRing p={p} pct={pct} size={72} />
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: body, fontWeight: 800, fontSize: 14, color: p.ink, margin: 0 }}>{hydration} / {goal} oz</p>
            <button onClick={addWater} style={{ marginTop: 8, background: p.accent, color: p.onBrand, border: "none", borderRadius: 14, padding: "9px 16px", fontFamily: body, fontWeight: 800, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Plus size={14} /> Add 8oz
            </button>
          </div>
        </div>

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

function NearbyScreen({ p }) {
  return (
    <div className="fade-in">
      <TopHeader p={p} title="Nearby" subtitle="Meets happening around you" />
      <div style={{ padding: "8px 22px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
        {NEARBY.map((e) => (
          <div key={e.title} style={{ display: "flex", alignItems: "center", gap: 14, background: p.card, border: `1px solid ${p.line}`, borderRadius: 18, padding: "14px 16px" }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: p.primarySoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{e.emoji}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: body, fontWeight: 800, fontSize: 14, color: p.ink, margin: 0 }}>{e.title}</p>
              <p style={{ fontFamily: body, fontSize: 12, color: p.inkFaint, margin: "2px 0 0" }}>{e.dist} away</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileScreen({ p, profile, setProfile, theme, setTheme, onThemeManualChange, onRestart }) {
  const toggleSupport = (key) => {
    const next = new Set(profile.support);
    next.has(key) ? next.delete(key) : next.add(key);
    setProfile({ ...profile, support: next });
  };

  return (
    <div className="fade-in">
      <TopHeader p={p} title="Profile" subtitle="Only what's needed" />
      <div style={{ padding: "8px 22px 32px", display: "flex", flexDirection: "column", gap: 16 }}>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: p.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, fontWeight: 800, color: p.onBrand, flexShrink: 0 }}>
            {(profile.name || "A")[0].toUpperCase()}
          </div>
          <div>
            <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Your name" style={{ border: "none", background: "none", fontFamily: body, fontWeight: 800, fontSize: 15, color: p.ink, padding: 0, width: 160 }} />
            <p style={{ fontFamily: body, fontSize: 12, color: p.inkFaint, margin: "2px 0 0" }}>{profile.sport}</p>
          </div>
        </div>

        <div>
          <p style={{ fontFamily: body, fontSize: 12.5, fontWeight: 800, color: p.inkFaint, margin: "0 0 8px" }}>Sport</p>
          <select value={profile.sport} onChange={(e) => setProfile({ ...profile, sport: e.target.value })} style={{ width: "100%", padding: "12px 14px", borderRadius: 14, border: `1px solid ${p.line}`, background: p.card, fontFamily: body, fontSize: 14, fontWeight: 700, color: p.ink }}>
            {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <p style={{ fontFamily: body, fontSize: 12.5, fontWeight: 800, color: p.inkFaint, margin: "0 0 8px" }}>Theme</p>
          <ThemeSwatches p={p} current={theme} onSelect={onThemeManualChange} />
        </div>

        <div>
          <p style={{ fontFamily: body, fontSize: 12.5, fontWeight: 800, color: p.inkFaint, margin: "0 0 8px" }}>Support needs</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {SUPPORT_OPTIONS.map((o) => {
              const active = profile.support.has(o.key);
              return (
                <button key={o.key} onClick={() => toggleSupport(o.key)} style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left", cursor: "pointer", background: active ? p.primarySoft : p.card, border: `1px solid ${active ? p.primary : p.line}`, borderRadius: 16, padding: "12px 14px" }}>
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
        </div>

        <div>
          <p style={{ fontFamily: body, fontSize: 12.5, fontWeight: 800, color: p.inkFaint, margin: "0 0 8px" }}>Send reminders by</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
          <p style={{ fontFamily: body, fontSize: 10.5, color: p.inkFaint, marginTop: 6, lineHeight: 1.4 }}>
            These are saved preferences. Actually sending texts/emails needs a small backend (e.g. Twilio or SendGrid) — the in-browser notification below works right now, no server needed.
          </p>
        </div>

        <button onClick={onRestart} style={{ background: "none", border: `1px dashed ${p.line}`, borderRadius: 14, padding: "12px 0", fontFamily: body, fontWeight: 700, fontSize: 13, color: p.inkFaint, cursor: "pointer" }}>
          Restart setup &amp; clear saved data
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  App shell                                                              */
/* ---------------------------------------------------------------------- */

const TABS = [
  { id: "home", label: "Home", icon: Home },
  { id: "calendar", label: "Calendar", icon: CalendarIcon },
  { id: "prep", label: "Prep", icon: Droplet },
  { id: "nearby", label: "Nearby", icon: MapPin },
  { id: "profile", label: "Profile", icon: User },
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

  // Persist whenever meaningful state changes.
  useEffect(() => {
    saveState({
      profile: { ...profile, support: [...profile.support] },
      theme, events, checklist, hydration,
    });
  }, [profile, theme, events, checklist, hydration]);

  const toggleItem = (i) => {
    setChecklist((prev) => {
      const next = prev.map((it, idx) => idx === i ? { ...it, done: !it.done } : it);
      if (next.length && next.every((it) => it.done)) {
        setCelebrate(true);
        setTimeout(() => setCelebrate(false), 1100);
      }
      return next;
    });
  };
  const addWater = () => setHydration((h) => Math.min(goal + 16, h + 8));
  const addEvent = (e) => setEvents((prev) => [...prev, e]);

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
    if (typeof Notification === "undefined") {
      setNotif({ permission: "unsupported" });
      return;
    }
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
  let content;

  if (stage === "welcome") {
    content = <WelcomeScreen p={p} onStart={() => setStage("onboard")} />;
  } else if (stage === "onboard") {
    content = (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <ProgressDots p={p} step={onboardStep} total={ONBOARD_STEPS} />

        {onboardStep === 0 && (
          <OnboardStepShell p={p} title="What should we call you?" sub="First name is plenty." showBack={false} onNext={() => setOnboardStep(1)}>
            <input autoFocus value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Your name" style={{ width: "100%", padding: "14px 16px", borderRadius: 16, border: `1px solid ${p.line}`, background: p.card, fontFamily: body, fontSize: 15, color: p.ink }} />
          </OnboardStepShell>
        )}

        {onboardStep === 1 && (
          <OnboardStepShell p={p} title="Pick your sport" sub="You can change this any time." onBack={() => setOnboardStep(0)} onNext={() => setOnboardStep(2)}>
            <select value={profile.sport} onChange={(e) => setProfile({ ...profile, sport: e.target.value })} style={{ width: "100%", padding: "14px 16px", borderRadius: 16, border: `1px solid ${p.line}`, background: p.card, fontFamily: body, fontSize: 15, fontWeight: 700, color: p.ink }}>
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
                  <button key={o.key} onClick={() => toggleSupport(o.key)} style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left", cursor: "pointer", background: active ? p.primarySoft : p.card, border: `1px solid ${active ? p.primary : p.line}`, borderRadius: 16, padding: "12px 14px" }}>
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
            </div>
          </OnboardStepShell>
        )}
      </div>
    );
  } else {
    const nextEvent = events[0];
    const screens = {
      home: <HomeScreen p={p} profile={profile} checklist={checklist} toggleItem={toggleItem} hydration={hydration} goal={goal} showInfo={showInfo} setShowInfo={setShowInfo} celebrate={celebrate} streak={3} nextEvent={nextEvent} weather={weather} fetchWeather={fetchWeather} notif={notif} requestNotif={requestNotif} sendReminder={sendReminder} />,
      calendar: <CalendarScreen p={p} events={events} addEvent={addEvent} />,
      prep: <PrepScreen p={p} mode={prepMode} setMode={setPrepMode} hydration={hydration} goal={goal} addWater={addWater} profile={profile} />,
      nearby: <NearbyScreen p={p} />,
      profile: <ProfileScreen p={p} profile={profile} setProfile={setProfile} theme={theme} setTheme={setTheme} onThemeManualChange={(k) => { setTheme(k); setThemeTouched(true); }} onRestart={restart} />,
    };
    content = (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ flex: 1, overflowY: "auto" }}>{screens[activeTab]}</div>
        <div style={{ display: "flex", justifyContent: "space-around", background: p.card, borderTop: `1px solid ${p.line}`, padding: "10px 4px 14px" }}>
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
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center", background: p.bg, minHeight: "100%", padding: "32px 16px", transition: "background 0.3s ease" }}>
      <GlobalStyle />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 12, background: p.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏆</div>
          <span style={{ fontFamily: display, fontSize: 18, fontWeight: 800, color: p.ink }}>SportsSteps</span>
        </div>

        <div style={{ width: 360, height: 740, borderRadius: 46, background: p.bezel, padding: 12, boxShadow: "0 25px 55px -20px rgba(20,25,45,0.35)" }}>
          <div style={{ width: "100%", height: "100%", borderRadius: 36, overflow: "hidden", background: p.bg, position: "relative", transition: "background 0.3s ease" }}>
            {content}
          </div>
        </div>

        <p style={{ fontFamily: body, fontSize: 12, color: p.inkFaint, maxWidth: 300, textAlign: "center" }}>
          Data saves to your browser · weather and notifications use real browser APIs
        </p>
      </div>
    </div>
  );
}
