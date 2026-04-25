import { Clipboard, Home, Import, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatTime } from './Header';
import { archiveDatesThroughToday, puzzleForDate } from '../game/puzzles';
import { JOBS } from '../game/jobs';
import type { SolveRecord } from '../game/types';
import { clearRecords, exportStatsCode, importStatsCode } from '../storage/localStats';

interface StatsProps {
  records: SolveRecord[];
  onNavigate(path: string): void;
  onRecordsChanged(): void;
}

export function Stats({ records, onNavigate, onRecordsChanged }: StatsProps) {
  const [backupCode, setBackupCode] = useState('');
  const [message, setMessage] = useState('');
  const solved = records.filter((record) => record.solved);
  const catalog = useMemo(() => archiveDatesThroughToday().map((dateKey) => puzzleForDate(dateKey)), []);
  const fastest = solved.reduce<SolveRecord | undefined>(
    (best, record) => (!best || record.elapsedSeconds < best.elapsedSeconds ? record : best),
    undefined,
  );
  const fewest = solved.reduce<SolveRecord | undefined>((best, record) => (!best || record.swaps < best.swaps ? record : best), undefined);
  const avgTime = solved.length ? Math.round(solved.reduce((total, record) => total + record.elapsedSeconds, 0) / solved.length) : 0;
  const avgSwaps = solved.length ? solved.reduce((total, record) => total + record.swaps, 0) / solved.length : 0;
  const featured = mostFeaturedJobs(catalog);
  const commonMechanics = mostCommonMechanics(catalog);
  const difficultyCounts = countBy(catalog.map((puzzle) => puzzle.difficulty));

  return (
    <main className="page-view stats-view">
      <div className="page-header">
        <button type="button" onClick={() => onNavigate('/')}>
          <Home size={16} />
          Today
        </button>
        <h1>Stats</h1>
        <button type="button" onClick={() => onNavigate('/archive')}>
          Archive
        </button>
      </div>

      <section>
        <h2>Your Stats</h2>
        {solved.length === 0 ? (
          <p className="muted">No puzzles played yet.</p>
        ) : (
          <div className="metric-grid">
            <Metric label="Solved" value={`${solved.length}/${records.length}`} />
            <Metric label="Average time" value={formatTime(avgTime)} />
            <Metric label="Average swaps" value={avgSwaps.toFixed(1)} />
            <Metric label="Best streak" value={String(bestStreak(solved))} />
            <Metric label="Fastest solve" value={fastest ? formatTime(fastest.elapsedSeconds) : '-'} />
            <Metric label="Fewest swaps" value={fewest ? String(fewest.swaps) : '-'} />
          </div>
        )}
      </section>

      <section>
        <h2>Puzzle Catalog</h2>
        <p className="muted">{catalog.length} dailies through today.</p>
        <div className="metric-grid compact">
          {Object.entries(difficultyCounts).map(([difficulty, count]) => (
            <Metric key={difficulty} label={difficulty} value={String(count)} />
          ))}
        </div>
      </section>

      <section className="two-column">
        <div>
          <h2>Most Featured Jobs</h2>
          <ul className="rank-list">
            {featured.map(([job, count]) => (
              <li key={job}>
                <span>{JOBS[job].name}</span>
                <strong>{count}</strong>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2>Common Mechanics</h2>
          <ul className="rank-list">
            {commonMechanics.map(([mechanic, count]) => (
              <li key={mechanic}>
                <span>{mechanic}</span>
                <strong>{count}</strong>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2>Recent Solves</h2>
        {solved.length === 0 ? (
          <p className="muted">Solved puzzles will appear here.</p>
        ) : (
          <ul className="solve-list">
            {[...solved]
              .sort((a, b) => b.solvedAt.localeCompare(a.solvedAt))
              .slice(0, 8)
              .map((record) => (
                <li key={record.id}>
                  <span>{record.dateLabel}</span>
                  <strong>{formatTime(record.elapsedSeconds)}</strong>
                  <span>{record.swaps} swaps</span>
                </li>
              ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Backup</h2>
        <div className="backup-row">
          <button
            type="button"
            onClick={async () => {
              const code = exportStatsCode();
              setBackupCode(code);
              await navigator.clipboard?.writeText(code).catch(() => undefined);
              setMessage('Backup code generated.');
            }}
          >
            <Clipboard size={16} />
            Generate Code
          </button>
          <button
            type="button"
            onClick={() => {
              try {
                const result = importStatsCode(backupCode.trim());
                onRecordsChanged();
                setMessage(`Imported ${result.added} new and ${result.updated} updated records.`);
              } catch (error) {
                setMessage(error instanceof Error ? error.message : 'Import failed.');
              }
            }}
          >
            <Import size={16} />
            Import Code
          </button>
          <button
            type="button"
            onClick={() => {
              clearRecords();
              onRecordsChanged();
              setMessage('Local records cleared.');
            }}
          >
            <Trash2 size={16} />
            Clear
          </button>
        </div>
        <textarea
          value={backupCode}
          onChange={(event) => setBackupCode(event.target.value)}
          placeholder="Paste or generate a cso1: backup code"
        />
        {message ? <p className="muted">{message}</p> : null}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function countBy(items: string[]): Record<string, number> {
  return items.reduce<Record<string, number>>((counts, item) => {
    counts[item] = (counts[item] ?? 0) + 1;
    return counts;
  }, {});
}

function bestStreak(records: SolveRecord[]): number {
  const dates = [...new Set(records.map((record) => record.dateKey))].sort();
  let best = 0;
  let current = 0;
  let previous = '';

  for (const date of dates) {
    const gap = previous ? (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${previous}T00:00:00Z`)) / 86_400_000 : 1;
    current = gap === 1 ? current + 1 : 1;
    best = Math.max(best, current);
    previous = date;
  }

  return best;
}

function mostFeaturedJobs(catalog: ReturnType<typeof puzzleForDate>[]): Array<[keyof typeof JOBS, number]> {
  const counts = new Map<keyof typeof JOBS, number>();
  for (const puzzle of catalog) {
    for (const job of puzzle.selectedJobs) {
      counts.set(job, (counts.get(job) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
}

function mostCommonMechanics(catalog: ReturnType<typeof puzzleForDate>[]): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const puzzle of catalog) {
    for (const clue of puzzle.clues) {
      if (clue.kind === 'mechanic') {
        const label = clue.mechanic.replaceAll('-', ' ');
        counts.set(label, (counts.get(label) ?? 0) + 1);
      }
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
}
