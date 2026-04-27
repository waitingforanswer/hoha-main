import { useState } from "react";
import {
  format,
  parseISO,
  getMonth,
  getYear,
  isBefore,
  addYears,
  isSameDay,
  startOfDay,
  differenceInCalendarDays,
} from "date-fns";
import { Calendar, Repeat } from "lucide-react";

interface FamilyEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  is_recurring: boolean;
}

interface EventTimelineProps {
  events: FamilyEvent[];
}

type EventStatus = "past" | "current" | "upcoming";

interface ProcessedEvent extends FamilyEvent {
  displayDate: Date;
  status: EventStatus;
  monthNum: number;
  color: string;
  colorLight: string;
}

const STATUS_COLOR: Record<EventStatus, { main: string; light: string }> = {
  past:     { main: "hsl(25 15% 65%)",  light: "hsl(25 15% 94%)"  },
  current:  { main: "hsl(0 72% 42%)",   light: "hsl(0 72% 97%)"   },
  upcoming: { main: "hsl(38 70% 45%)",  light: "hsl(38 70% 96%)"  },
};

const MONTH_LABELS = ["","Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];


function processEvents(events: FamilyEvent[]): ProcessedEvent[] {
  const today = new Date();
  const todayStart = startOfDay(today);

  return events
    .map((event) => {
      const eventDate = parseISO(event.event_date);
      let displayDate = eventDate;

      if (event.is_recurring) {
        const thisYear = new Date(
          getYear(today),
          getMonth(eventDate),
          eventDate.getDate()
        );
        displayDate = isBefore(thisYear, todayStart)
          ? addYears(thisYear, 1)
          : thisYear;
      }

      const displayStart = startOfDay(displayDate);
      let status: EventStatus;
      if (isSameDay(displayStart, todayStart)) {
        status = "current";
      } else if (isBefore(displayStart, todayStart)) {
        status = "past";
      } else {
        status = "upcoming";
      }

      const { main, light } = STATUS_COLOR[status];
      return {
        ...event,
        displayDate,
        status,
        monthNum: displayDate.getMonth() + 1,
        color: main,
        colorLight: light,
      };
    })
    .sort((a, b) => a.displayDate.getTime() - b.displayDate.getTime());
}

/* ── Ornament line ── */
function OrnamentLine() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        justifyContent: "center",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          height: 1,
          width: 60,
          background: "linear-gradient(to right, transparent, hsl(38 70% 50% / 0.5))",
        }}
      />
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M10 2 L12 8 L18 8 L13 12 L15 18 L10 14 L5 18 L7 12 L2 8 L8 8 Z"
          fill="hsl(38 70% 50%)"
          opacity="0.7"
        />
      </svg>
      <div
        style={{
          height: 1,
          width: 60,
          background: "linear-gradient(to left, transparent, hsl(38 70% 50% / 0.5))",
        }}
      />
    </div>
  );
}

/* ── Next event countdown banner ── */
function NextEventBanner({ events }: { events: ProcessedEvent[] }) {
  const today = startOfDay(new Date());

  const nearest = events
    .filter((e) => e.status === "current" || e.status === "upcoming")
    .sort((a, b) => a.displayDate.getTime() - b.displayDate.getTime())[0];

  if (!nearest) return null;

  const days = differenceInCalendarDays(startOfDay(nearest.displayDate), today);

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        background: `${nearest.color}0f`,
        border: `1.5px solid ${nearest.color}28`,
        borderRadius: 12,
        padding: "10px 16px",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: nearest.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Calendar size={17} color="white" />
      </div>
      <div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.07em",
            color: nearest.color,
            textTransform: "uppercase",
            lineHeight: 1,
            marginBottom: 3,
          }}
        >
          Sắp tới
        </div>
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 13,
            fontWeight: 700,
            color: "hsl(25 30% 15%)",
            lineHeight: 1.2,
          }}
        >
          {nearest.title}
        </div>
        <div style={{ fontSize: 11, color: "hsl(25 15% 45%)", marginTop: 2 }}>
          {format(nearest.displayDate, "dd")} tháng{" "}
          {nearest.displayDate.getMonth() + 1}
        </div>
      </div>
      <div
        style={{
          marginLeft: 6,
          paddingLeft: 12,
          borderLeft: `1.5px solid ${nearest.color}25`,
          textAlign: "center",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 26,
            fontWeight: 900,
            color: nearest.color,
            lineHeight: 1,
          }}
        >
          {days}
        </div>
        <div
          style={{
            fontSize: 10,
            color: "hsl(25 15% 45%)",
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          ngày nữa
        </div>
      </div>
    </div>
  );
}

/* ── Month filter tabs ── */
function MonthFilters({
  activeMonth,
  onChange,
  availableMonths,
}: {
  activeMonth: number | null;
  onChange: (m: number | null) => void;
  availableMonths: number[];
}) {
  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: "8px 18px",
    borderRadius: 99,
    border: `1.5px solid ${active ? "hsl(0 72% 42%)" : "hsl(30 25% 85%)"}`,
    background: active ? "hsl(0 72% 42%)" : "transparent",
    color: active ? "white" : "hsl(25 15% 45%)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'Be Vietnam Pro', sans-serif",
    transition: "all 0.2s",
  });

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        justifyContent: "flex-end",
      }}
    >
      <button style={pillStyle(activeMonth === null)} onClick={() => onChange(null)}>
        Tất cả
      </button>
      {availableMonths.map((m) => (
        <button key={m} style={pillStyle(activeMonth === m)} onClick={() => onChange(m)}>
          {MONTH_LABELS[m]}
        </button>
      ))}
    </div>
  );
}

/* ── Compact card ── */
function CompactCard({
  event,
  index,
}: {
  event: ProcessedEvent;
  index: number;
}) {
  const [hov, setHov] = useState(false);
  const { color, colorLight } = event;
  const isPast = event.status === "past";

  const descStyle: React.CSSProperties = hov
    ? { fontSize: 13, color: "hsl(25 15% 45%)", lineHeight: 1.6 }
    : {
        fontSize: 13,
        color: "hsl(25 15% 45%)",
        lineHeight: 1.6,
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      };

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? colorLight : "hsl(38 50% 99%)",
        border: `1.5px solid ${hov ? color : "hsl(30 25% 88%)"}`,
        borderRadius: 14,
        padding: "16px 20px",
        display: "flex",
        gap: 18,
        alignItems: hov ? "flex-start" : "center",
        transition: "all 0.25s ease",
        transform: hov ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hov
          ? `0 6px 24px -4px ${color}35`
          : "0 1px 6px hsl(25 30% 20% / 0.06)",
        opacity: isPast ? 0.65 : 1,
        animation: `fadeUp 0.4s ${index * 50}ms ease-out both`,
      }}
    >
      {/* Date bubble */}
      <div
        style={{
          width: 54,
          height: 54,
          borderRadius: "50%",
          flexShrink: 0,
          background: hov ? color : "transparent",
          border: `2px solid ${hov ? color : `${color}40`}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.25s",
        }}
      >
        <span
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 20,
            fontWeight: 900,
            lineHeight: 1,
            color: hov ? "white" : color,
            transition: "color 0.25s",
          }}
        >
          {format(event.displayDate, "dd")}
        </span>
        <span
          style={{
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: "0.05em",
            color: hov ? "rgba(255,255,255,0.75)" : `${color}90`,
            marginTop: 2,
            transition: "color 0.25s",
          }}
        >
          T.{format(event.displayDate, "M")}
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 4,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 15,
              fontWeight: 700,
              color: hov ? color : "hsl(25 30% 15%)",
              transition: "color 0.25s",
            }}
          >
            {event.title}
          </span>
          {event.is_recurring && (
            <Repeat
              size={11}
              color="hsl(25 15% 55%)"
              style={{ flexShrink: 0 }}
            />
          )}
        </div>
        {event.description && <p style={descStyle}>{event.description}</p>}
      </div>
    </div>
  );
}

/* ── Main export ── */
const EventTimeline = ({ events }: EventTimelineProps) => {
  const [activeMonth, setActiveMonth] = useState<number | null>(null);

  const processed = processEvents(events);
  if (processed.length === 0) return null;

  const availableMonths = [
    ...new Set(processed.map((e) => e.monthNum)),
  ].sort((a, b) => a - b);

  const filtered = activeMonth
    ? processed.filter((e) => e.monthNum === activeMonth)
    : processed;

  return (
    <section
      style={{
        padding: "64px 0 72px",
        background:
          "linear-gradient(180deg, hsl(38 45% 91%) 0%, hsl(38 40% 87%) 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative circles */}
      <div
        style={{
          position: "absolute",
          top: -80,
          right: -80,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "hsl(0 72% 42% / 0.04)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -60,
          left: -60,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "hsl(38 70% 50% / 0.05)",
          pointerEvents: "none",
        }}
      />

      <div className="container" style={{ position: "relative" }}>
        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "hsl(0 72% 42% / 0.08)",
              border: "1px solid hsl(0 72% 42% / 0.18)",
              borderRadius: 99,
              padding: "7px 18px",
              marginBottom: 20,
            }}
          >
            <Calendar size={14} color="hsl(0 72% 42%)" />
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.07em",
                color: "hsl(0 72% 42%)",
                textTransform: "uppercase",
              }}
            >
              Lịch Dòng Họ
            </span>
          </div>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(28px, 4.5vw, 46px)",
              fontWeight: 700,
              lineHeight: 1.1,
              marginBottom: 16,
              color: "hsl(25 30% 15%)",
            }}
          >
            Các{" "}
            <span
              style={{
                background:
                  "linear-gradient(135deg, hsl(0 72% 42%), hsl(38 70% 45%))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Ngày Quan Trọng
            </span>
          </h2>
          <OrnamentLine />
          <p
            style={{
              color: "hsl(25 15% 45%)",
              fontSize: 15,
              lineHeight: 1.6,
              maxWidth: 520,
              margin: "0 auto 32px",
            }}
          >
            Những ngày giỗ, lễ hội, họp mặt dòng họ cần nhớ
          </p>
        </div>

        {/* Banner + filter row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 32,
            flexWrap: "wrap",
          }}
        >
          <NextEventBanner events={processed} />
          <MonthFilters
            activeMonth={activeMonth}
            onChange={setActiveMonth}
            availableMonths={availableMonths}
          />
        </div>

        {/* Scrollable list */}
        <div style={{ position: "relative" }}>
          <div
            style={{
              maxHeight: "306px",
              overflowY: "auto",
              paddingRight: 4,
              scrollbarWidth: "thin",
              scrollbarColor: "hsl(38 50% 70%) transparent",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {filtered.map((event, i) => (
              <CompactCard key={event.id} event={event} index={i} />
            ))}
          </div>
          {/* Fade hint at bottom */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 48,
              background:
                "linear-gradient(to top, hsl(38 40% 87%), transparent)",
              pointerEvents: "none",
              borderRadius: "0 0 8px 8px",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
};

export default EventTimeline;
