"use client";

import { useState, useEffect } from "react";

/* ─────────────────────────────────────────────────────────────
   TIME-AWARE GREETING ENGINE
   ───────────────────────────────────────────────────────────── */
export interface TimeContext {
  greeting: string;
  subline: string;
  icon: string;
  palette: "dawn" | "morning" | "coffee" | "lunch" | "afternoon" | "evening" | "night";
  mealTag?: string;
}

export function getTimeContext(): TimeContext {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const day = now.getDay(); // 0=Sun, 6=Sat
  const totalMins = h * 60 + m;

  const dayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = dayLabels[day];
  const isWeekend = day === 0 || day === 6;
  const isMonday = day === 1;
  const isFriday = day === 5;

  // Day-of-week flavour suffix
  let daySuffix = "";
  if (isMonday)       daySuffix = "— fresh start to the week";
  else if (isFriday)  daySuffix = "— almost the weekend";
  else if (day === 0) daySuffix = "— hope your Sunday is restful";
  else if (day === 6) daySuffix = "— happy Saturday";

  let slot: TimeContext;

  if (totalMins >= 300 && totalMins < 420) {
    // 05:00–07:00  Dawn / early bird
    slot = {
      greeting: "Early bird! Good morning",
      subline: isWeekend
        ? "An early weekend start — love the dedication."
        : "You're up before the crowd. Let's make it count.",
      icon: "🌅",
      palette: "dawn",
    };
  } else if (totalMins >= 420 && totalMins < 570) {
    // 07:00–09:30  Breakfast time
    slot = {
      greeting: "Good morning",
      subline: isWeekend
        ? "Weekend breakfast vibes — no rush today."
        : `Happy ${dayName}! Breakfast hour — fuel up before we dive in.`,
      icon: "🍳",
      palette: "morning",
      mealTag: "Breakfast time",
    };
  } else if (totalMins >= 570 && totalMins < 660) {
    // 09:30–11:00  Mid-morning coffee
    slot = {
      greeting: "Good morning",
      subline: isWeekend
        ? "Mid-morning on a " + dayName + " — the perfect pace."
        : "Mid-morning. Perfect time for a second coffee and a big idea.",
      icon: "☕",
      palette: "coffee",
      mealTag: "Coffee o'clock",
    };
  } else if (totalMins >= 660 && totalMins < 750) {
    // 11:00–12:30  Pre-lunch
    slot = {
      greeting: "Good morning",
      subline: isWeekend
        ? `${dayName} morning — what are we getting into today?`
        : "Almost noon. Let's power through before the lunch break.",
      icon: "🕚",
      palette: "morning",
    };
  } else if (totalMins >= 750 && totalMins < 840) {
    // 12:30–14:00  Lunch
    slot = {
      greeting: "Good afternoon",
      subline: isWeekend
        ? "Lunchtime on a " + dayName + " — eat something good."
        : `Lunch break on ${dayName}. Quick question before the sandwich?`,
      icon: "🥗",
      palette: "lunch",
      mealTag: "Lunch break",
    };
  } else if (totalMins >= 840 && totalMins < 930) {
    // 14:00–15:30  Afternoon
    slot = {
      greeting: "Good afternoon",
      subline: isWeekend
        ? "A lazy " + dayName + " afternoon — perfect for deep dives."
        : isFriday
          ? "Friday afternoon — let's close the week strong."
          : "Post-lunch afternoon. Deep work mode or a quick assist?",
      icon: "🌤",
      palette: "afternoon",
    };
  } else if (totalMins >= 930 && totalMins < 1020) {
    // 15:30–17:00  Afternoon coffee
    slot = {
      greeting: "Good afternoon",
      subline: "Time for afternoon coffee ☕ Refuel and let's crack something.",
      icon: "☕",
      palette: "coffee",
      mealTag: "Afternoon coffee",
    };
  } else if (totalMins >= 1020 && totalMins < 1140) {
    // 17:00–19:00  Early evening / dinner time
    slot = {
      greeting: "Good evening",
      subline: isWeekend
        ? "Early evening on a " + dayName + " — dinner plans later?"
        : isFriday
          ? "Friday evening — wrapping up or heading out?"
          : "End of the work day — dinner time soon. What can I help with?",
      icon: "🍝",
      palette: "evening",
      mealTag: "Dinner time",
    };
  } else if (totalMins >= 1140 && totalMins < 1260) {
    // 19:00–21:00  Evening
    slot = {
      greeting: "Good evening",
      subline: isWeekend
        ? "A lovely " + dayName + " evening. What's on your mind?"
        : "Evening hours — the best time for creative thinking.",
      icon: "🌆",
      palette: "evening",
    };
  } else if (totalMins >= 1260 && totalMins < 1380) {
    // 21:00–23:00  Night
    slot = {
      greeting: "Good evening",
      subline: isWeekend
        ? `Late ${dayName} — the night is young.`
        : "Burning the midnight oil? I'm right here with you.",
      icon: "🌙",
      palette: "night",
    };
  } else {
    // 23:00–05:00  Late night
    slot = {
      greeting: "Night owl mode",
      subline: "Way past midnight — the truly interesting work happens now.",
      icon: "🦉",
      palette: "night",
    };
  }

  if (daySuffix && !slot.mealTag) {
    slot.subline = slot.subline.replace(/\.$/, "") + (daySuffix ? " " + daySuffix + "." : ".");
  }

  return slot;
}

/* ─────────────────────────────────────────────────────────────
   PALETTE DEFINITIONS FOR WELCOME SCREEN
   ───────────────────────────────────────────────────────────── */
export const PALETTES = {
  dawn:      { gradFrom: "#FEF3C7", gradTo: "#FDE68A", accent: "#D97706", dot: "#F59E0B" },
  morning:   { gradFrom: "#DBEAFE", gradTo: "#BFDBFE", accent: "#2563EB", dot: "#3B82F6" },
  coffee:    { gradFrom: "#FDF6EC", gradTo: "#FDE8C8", accent: "#92400E", dot: "#D97706" },
  lunch:     { gradFrom: "#DCFCE7", gradTo: "#BBF7D0", accent: "#166534", dot: "#22C55E" },
  afternoon: { gradFrom: "#EDE9FE", gradTo: "#DDD6FE", accent: "#7C3AED", dot: "#8B5CF6" },
  evening:   { gradFrom: "#FEE2E2", gradTo: "#FED7AA", accent: "#B45309", dot: "#F97316" },
  night:     { gradFrom: "#1E1B4B", gradTo: "#312E81", accent: "#818CF8", dot: "#6366F1" },
};

/* ─────────────────────────────────────────────────────────────
   SUGGESTION CHIPS DEFINITIONS
   ───────────────────────────────────────────────────────────── */
export const CHIPS = {
  dawn:      [{ icon: "✍️", label: "Help me plan my day" }, { icon: "📖", label: "Explain something" }, { icon: "🎯", label: "Set a goal with me" }],
  morning:   [{ icon: "📝", label: "Draft an email" }, { icon: "💡", label: "Brainstorm ideas" }, { icon: "🔍", label: "Research a topic" }],
  coffee:    [{ icon: "☕", label: "Quick summary" }, { icon: "📊", label: "Analyse this data" }, { icon: "💬", label: "Talk through a problem" }],
  lunch:     [{ icon: "⚡", label: "Fast answer needed" }, { icon: "🧩", label: "Solve a puzzle" }, { icon: "📅", label: "Help me plan ahead" }],
  afternoon: [{ icon: "🖊️", label: "Edit my writing" }, { icon: "💻", label: "Help me code" }, { icon: "📚", label: "Summarise a document" }],
  evening:   [{ icon: "🌇", label: "Reflect on my day" }, { icon: "🍝", label: "Recipe ideas" }, { icon: "📕", label: "Recommend a read" }],
  night:     [{ icon: "🌙", label: "Creative writing" }, { icon: "🔭", label: "Deep-dive question" }, { icon: "🎵", label: "Music or film recs" }],
};

/* ─────────────────────────────────────────────────────────────
   SHARED WELCOME SCREEN COMPONENT
   ───────────────────────────────────────────────────────────── */
export function WelcomeScreen({ userName, onSend }: { userName?: string; onSend?: (t: string) => void }) {
  const [timeCtx, setTimeCtx] = useState<TimeContext>(getTimeContext);

  useEffect(() => {
    const id = setInterval(() => setTimeCtx(getTimeContext()), 60_000);
    return () => clearInterval(id);
  }, []);

  const pal = PALETTES[timeCtx.palette] || PALETTES.morning;
  const chips = CHIPS[timeCtx.palette] || CHIPS.morning;

  const firstName = userName ? userName.split(" ")[0] : "user";
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = dayNames[new Date().getDay()];
  const formattedDay = dayName === "Wednesday" ? "wednessday" : dayName.toLowerCase();

  const greetingLine = `${timeCtx.greeting}, happy ${formattedDay} ${firstName}`;

  return (
    <>
      <style>{`
        .welcome {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 20px 20px 32px;
          animation: welcomeIn 0.55s ease both;
          width: 100%;
          max-width: 720px;
          align-self: center;
        }

        .welcome-icon-wrap {
          position: relative;
          margin-bottom: 22px;
        }

        .welcome-ring {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
          position: relative;
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          cursor: default;
        }

        .welcome-ring::before {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          background: conic-gradient(from 0deg, var(--ring-from), var(--ring-to), var(--ring-from));
          opacity: 0.25;
          animation: spin 8s linear infinite;
        }

        .welcome-ring:hover {
          transform: scale(1.08) rotate(5deg);
        }

        .meal-badge {
          position: absolute;
          bottom: -6px;
          right: -10px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 99px;
          padding: 3px 9px;
          font-size: 11px;
          font-weight: 500;
          color: var(--text-2);
          white-space: nowrap;
          box-shadow: var(--shadow-sm);
          animation: badgePop 0.5s 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }

        @keyframes badgePop {
          from { opacity: 0; transform: scale(0.7) translateY(4px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        @keyframes welcomeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        .welcome-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
          max-width: 560px;
          animation: welcomeIn 0.55s 0.2s ease both;
          margin-top: 24px;
        }

        .welcome-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          cursor: pointer;
          font-family: var(--font-body);
          font-size: 13px;
          color: var(--text-2);
          transition: all 0.2s ease;
          box-shadow: var(--shadow-sm);
          white-space: nowrap;
        }

        .welcome-chip:hover {
          border-color: var(--accent);
          color: var(--accent);
          background: var(--accent-subtle);
          transform: translateY(-1px);
        }

        .welcome-chip-icon {
          font-size: 14px;
        }
      `}</style>

      <div className="welcome">
        <div className="welcome-icon-wrap">
          <div
            className="welcome-ring"
            style={{
              // @ts-ignore
              "--ring-from": pal.gradFrom,
              "--ring-to": pal.gradTo,
              background: `linear-gradient(135deg, ${pal.gradFrom}, ${pal.gradTo})`,
            }}
          >
            <span role="img" aria-label="time icon">{timeCtx.icon}</span>
          </div>
          {timeCtx.mealTag && (
            <div className="meal-badge">{timeCtx.mealTag}</div>
          )}
        </div>

        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(24px, 4.5vw, 42px)",
            fontWeight: 400,
            color: "var(--text)",
            marginBottom: 8,
            letterSpacing: "-0.025em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            width: "100%",
            textAlign: "center",
          }}
        >
          {greetingLine}
        </h1>
        <p
          className="welcome-sub"
          style={{
            fontSize: "14px",
            color: "var(--text-2)",
            maxWidth: "480px",
            lineHeight: "1.65",
            margin: "0 auto",
          }}
        >
          {timeCtx.subline}
        </p>

        <div className="welcome-chips" role="list">
          {chips.map((chip, i) => (
            <button
              key={i}
              className="welcome-chip"
              role="listitem"
              onClick={() => onSend?.(chip.label)}
            >
              <span className="welcome-chip-icon" aria-hidden="true">{chip.icon}</span>
              {chip.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   INDIVIDUAL WRAPPERS FOR PRESERVING COMPATIBILITY
   ───────────────────────────────────────────────────────────── */
export function Greeting1({ userName, onSend }: { userName?: string; onSend?: (t: string) => void }) {
  return <WelcomeScreen userName={userName} onSend={onSend} />;
}

export function Greeting2({ userName, onSend }: { userName?: string; onSend?: (t: string) => void }) {
  return <WelcomeScreen userName={userName} onSend={onSend} />;
}

export function Greeting3({ userName, onSend }: { userName?: string; onSend?: (t: string) => void }) {
  return <WelcomeScreen userName={userName} onSend={onSend} />;
}

export function Greeting5({ userName, onSend }: { userName?: string; onSend?: (t: string) => void }) {
  return <WelcomeScreen userName={userName} onSend={onSend} />;
}

export function Greeting6({ userName, onSend }: { userName?: string; onSend?: (t: string) => void }) {
  return <WelcomeScreen userName={userName} onSend={onSend} />;
}

export function Greeting7({ userName, onSend }: { userName?: string; onSend?: (t: string) => void }) {
  return <WelcomeScreen userName={userName} onSend={onSend} />;
}

export function Greeting8({ userName, onSend }: { userName?: string; onSend?: (t: string) => void }) {
  return <WelcomeScreen userName={userName} onSend={onSend} />;
}

// Greeting map for easy lookup
export const GREETING_VARIANTS = [
  { id: "morning", label: "Morning", C: Greeting1 },
  { id: "night", label: "Late Night", C: Greeting2 },
  { id: "typewriter", label: "Typewriter", C: Greeting3 },
  { id: "monday", label: "Monday", C: Greeting5 },
  { id: "friday", label: "Friday", C: Greeting6 },
  { id: "zen", label: "Zen", C: Greeting7 },
  { id: "focus", label: "Focus", C: Greeting8 },
] as const;

/** Rotate greeting template by day of the week */
export function pickGreeting(): typeof GREETING_VARIANTS[number] {
  const h = new Date().getHours();
  if (h < 8 || h >= 22) {
    return GREETING_VARIANTS[1];
  }

  const day = new Date().getDay();
  // Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6
  const dayMap: Record<number, number> = {
    0: 5, // Sunday    → Zen
    1: 3, // Monday    → Monday Energy
    2: 6, // Tuesday   → Focus
    3: 2, // Wednesday → Typewriter
    4: 2, // Thursday  → Typewriter
    5: 4, // Friday    → Friday Sparkle
    6: 0, // Saturday  → Morning Sunrise
  };
  return GREETING_VARIANTS[dayMap[day]];
}
