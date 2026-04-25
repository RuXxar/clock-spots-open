import { BarChart3, CalendarDays, HelpCircle, Home, RotateCcw, Star } from "lucide-react";
import type { DifficultyId } from "../game/types";

const DIFFICULTY_LABEL: Record<DifficultyId, string> = {
  normal: "Normal",
  extreme: "Extreme",
  savage: "Savage",
  ultimate: "Ultimate",
};

interface HeaderProps {
  dateLabel: string;
  difficulty: DifficultyId;
  elapsed: number;
  swaps: number;
  easyMode: boolean;
  onNavigate(path: string): void;
  onArchive(): void;
  onReset(): void;
  onToggleEasy(): void;
  onTutorial(): void;
}

export function Header({
  dateLabel,
  difficulty,
  elapsed,
  swaps,
  easyMode,
  onNavigate,
  onArchive,
  onReset,
  onToggleEasy,
  onTutorial,
}: HeaderProps) {
  return (
    <header className="site-header">
      <div className="nav-line">
        <button className="link-button" type="button" onClick={() => onNavigate("/")}>
          <Home size={15} />
          Today
        </button>
        <h1>Clock Spots Open</h1>
        <div className="nav-actions">
          <button className="link-button" type="button" onClick={onArchive}>
            <CalendarDays size={15} />
            Archive
          </button>
          <button className="link-button" type="button" onClick={() => onNavigate("/stats")}>
            <BarChart3 size={15} />
            Stats
          </button>
        </div>
      </div>
      <div className="puzzle-meta">
        <span>{dateLabel}</span>
        <span className={`difficulty ${difficulty}`}>{DIFFICULTY_LABEL[difficulty]}</span>
        <span>{formatTime(elapsed)}</span>
        <span>{swaps} swaps</span>
      </div>
      <div className="toolbar">
        <button className={easyMode ? "active" : ""} type="button" onClick={onToggleEasy}>
          <Star size={16} />
          Easy Mode
        </button>
        <button type="button" onClick={onTutorial}>
          <HelpCircle size={16} />
          Tutorial
        </button>
        <button type="button" onClick={onReset}>
          <RotateCcw size={16} />
          Reset
        </button>
      </div>
    </header>
  );
}

export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
