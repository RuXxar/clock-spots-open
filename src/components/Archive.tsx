import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { useState } from 'react';
import { compareDateKeys, getMonthMatrix, monthTitle, parseDateKey } from '../game/date';
import { firstDailyKey, puzzleForDate, todayKey } from '../game/puzzles';

interface ArchiveProps {
  onNavigate(path: string, search?: URLSearchParams): void;
}

export function Archive({ onNavigate }: ArchiveProps) {
  const today = todayKey();
  const initial = parseDateKey(today);
  const [monthCursor, setMonthCursor] = useMonthCursor(initial.getUTCFullYear(), initial.getUTCMonth());
  const [year, month] = monthCursor;
  const cells = getMonthMatrix(year, month);

  return (
    <main className="page-view">
      <div className="page-header">
        <button type="button" onClick={() => onNavigate('/')}>
          <Home size={16} />
          Today
        </button>
        <h1>Puzzle Archive</h1>
        <button type="button" onClick={() => onNavigate('/stats')}>
          Stats
        </button>
      </div>
      <div className="calendar-toolbar">
        <button type="button" onClick={() => setMonthCursor([month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1])}>
          <ChevronLeft size={17} />
        </button>
        <strong>{monthTitle(year, month)}</strong>
        <button type="button" onClick={() => setMonthCursor([month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1])}>
          <ChevronRight size={17} />
        </button>
      </div>
      <button className="ghost" type="button" onClick={() => setMonthCursor([initial.getUTCFullYear(), initial.getUTCMonth()])}>
        Jump to current month
      </button>
      <div className="calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
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
          return (
            <button
              className={`day-tile ${dateKey === today ? 'today' : ''}`}
              disabled={future || beforeLaunch}
              key={dateKey}
              type="button"
              onClick={() => {
                const search = new URLSearchParams({ date: dateKey });
                onNavigate('/', search);
              }}
            >
              <strong>{Number(dateKey.slice(8))}</strong>
              {puzzle ? <span>{puzzle.difficulty}</span> : <span>{future ? 'locked' : 'closed'}</span>}
            </button>
          );
        })}
      </div>
      <p className="muted">Future puzzles unlock at midnight Eastern time.</p>
    </main>
  );
}

function useMonthCursor(year: number, month: number): [[number, number], (value: [number, number]) => void] {
  return useState<[number, number]>([year, month]);
}
