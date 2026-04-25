import { BarChart3, ChevronLeft, ChevronRight, Home, X } from "lucide-react";
import { useEffect, useState } from "react";
import { compareDateKeys, getMonthMatrix, monthTitle, parseDateKey } from "../game/date";
import { firstDailyKey, puzzleForDate, todayKey } from "../game/puzzles";

interface ArchiveProps {
  open: boolean;
  onClose(): void;
  onNavigate(path: string, search?: URLSearchParams): void;
}

export function Archive({ open, onClose, onNavigate }: ArchiveProps) {
  const today = todayKey();
  const initial = parseDateKey(today);
  const [monthCursor, setMonthCursor] = useMonthCursor(
    initial.getUTCFullYear(),
    initial.getUTCMonth(),
  );
  const [year, month] = monthCursor;
  const cells = getMonthMatrix(year, month);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside
        aria-labelledby="archive-title"
        aria-modal="true"
        className="archive-drawer"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="drawer-header">
          <div>
            <span>Archive</span>
            <h1 id="archive-title">Puzzle Archive</h1>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close archive"
          >
            <X size={18} />
          </button>
        </div>
        <div className="drawer-actions">
          <button type="button" onClick={() => onNavigate("/")}>
            <Home size={16} />
            Today
          </button>
          <button type="button" onClick={() => onNavigate("/stats")}>
            <BarChart3 size={16} />
            Stats
          </button>
        </div>
        <div className="calendar-toolbar">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() =>
              setMonthCursor([month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1])
            }
          >
            <ChevronLeft size={17} />
          </button>
          <strong>{monthTitle(year, month)}</strong>
          <button
            type="button"
            aria-label="Next month"
            onClick={() =>
              setMonthCursor([month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1])
            }
          >
            <ChevronRight size={17} />
          </button>
        </div>
        <button
          className="ghost"
          type="button"
          onClick={() => setMonthCursor([initial.getUTCFullYear(), initial.getUTCMonth()])}
        >
          Jump to current month
        </button>
        <div className="calendar-grid">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <span className="weekday" key={day}>
              {day}
            </span>
          ))}
          {cells.map((dateKey, index) => {
            if (!dateKey) {
              return <span className="empty-day" key={`empty-${index}`} />;
            }
            const future = compareDateKeys(dateKey, today) > 0;
            const beforeLaunch = compareDateKeys(dateKey, firstDailyKey()) < 0;
            const puzzle = !future && !beforeLaunch ? puzzleForDate(dateKey) : null;
            const label = puzzle ? puzzle.difficulty : future ? "locked" : "closed";
            const shortLabel = puzzle
              ? SHORT_DIFFICULTY_LABEL[puzzle.difficulty]
              : future
                ? "Lock"
                : "-";
            return (
              <button
                className={`day-tile ${dateKey === today ? "today" : ""}`}
                aria-label={`${dateKey} ${label}`}
                disabled={future || beforeLaunch}
                key={dateKey}
                type="button"
                onClick={() => {
                  const search = new URLSearchParams({ date: dateKey });
                  onNavigate("/", search);
                }}
              >
                <strong>{Number(dateKey.slice(8))}</strong>
                <span className="tile-label" aria-hidden="true">
                  <span className="tile-label-full">{label}</span>
                  <span className="tile-label-short">{shortLabel}</span>
                </span>
              </button>
            );
          })}
        </div>
        <p className="muted">Future puzzles unlock at midnight Eastern time.</p>
      </aside>
    </div>
  );
}

function useMonthCursor(
  year: number,
  month: number,
): [[number, number], (value: [number, number]) => void] {
  return useState<[number, number]>([year, month]);
}

const SHORT_DIFFICULTY_LABEL = {
  normal: "N",
  extreme: "EX",
  savage: "S",
  ultimate: "U",
} as const;
