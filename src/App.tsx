import { useEffect, useMemo, useState } from "react";
import { Archive } from "./components/Archive";
import { Board } from "./components/Board";
import { Header } from "./components/Header";
import { OrderPanel } from "./components/OrderPanel";
import { Privacy } from "./components/Privacy";
import { ShareDialog } from "./components/ShareDialog";
import { StartDialog } from "./components/StartDialog";
import { Stats } from "./components/Stats";
import { TutorialModal } from "./components/TutorialModal";
import { countSatisfied, evaluateAllClues } from "./game/clues";
import { swapSlots } from "./game/board";
import { puzzleForDate, puzzleForToday, todayKey } from "./game/puzzles";
import type { BoardSlots, DifficultyId, PositionId, SolveRecord } from "./game/types";
import {
  loadRecords,
  loadSettings,
  saveRecord,
  saveSettings,
  type Settings,
} from "./storage/localStats";

const DIFFICULTY_LABEL: Record<DifficultyId, string> = {
  normal: "Normal",
  extreme: "Extreme",
  savage: "Savage",
  ultimate: "Ultimate",
};

export function App() {
  const [location, setLocation] = useState(() => readLocation());
  const [records, setRecords] = useState<SolveRecord[]>(() => loadRecords());
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [archiveOpen, setArchiveOpen] = useState(() => window.location.pathname === "/archive");

  useEffect(() => {
    const handlePop = () => setLocation(readLocation());
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  useEffect(() => {
    if (location.pathname === "/archive") {
      setArchiveOpen(true);
    }
  }, [location.pathname]);

  const navigate = (path: string, search?: URLSearchParams, replace = false) => {
    if (path === "/archive") {
      setArchiveOpen(true);
      return;
    }
    const query = search?.toString();
    const url = `${path}${query ? `?${query}` : ""}`;
    if (replace) {
      window.history.replaceState(null, "", url);
    } else {
      window.history.pushState(null, "", url);
    }
    setArchiveOpen(false);
    setLocation(readLocation());
  };

  const openArchive = () => setArchiveOpen(true);
  const closeArchive = () => {
    setArchiveOpen(false);
    if (location.pathname === "/archive") {
      navigate("/", undefined, true);
    }
  };

  const archiveDrawer = <Archive open={archiveOpen} onClose={closeArchive} onNavigate={navigate} />;

  if (location.pathname === "/stats") {
    return (
      <>
        <Stats
          records={records}
          onNavigate={navigate}
          onArchive={openArchive}
          onRecordsChanged={() => setRecords(loadRecords())}
        />
        {archiveDrawer}
      </>
    );
  }

  if (location.pathname === "/privacy") {
    return (
      <>
        <Privacy onNavigate={navigate} />
        {archiveDrawer}
      </>
    );
  }

  return (
    <>
      <GamePage
        dateKey={location.search.get("date") ?? todayKey()}
        settings={settings}
        onRecordsChanged={() => setRecords(loadRecords())}
        onSettingsChanged={(next) => {
          setSettings(next);
          saveSettings(next);
        }}
        onNavigate={navigate}
        onArchive={openArchive}
      />
      {archiveDrawer}
    </>
  );
}

interface GamePageProps {
  dateKey: string;
  settings: Settings;
  onRecordsChanged(): void;
  onSettingsChanged(settings: Settings): void;
  onNavigate(path: string, search?: URLSearchParams): void;
  onArchive(): void;
}

function GamePage({
  dateKey,
  settings,
  onRecordsChanged,
  onSettingsChanged,
  onNavigate,
  onArchive,
}: GamePageProps) {
  const puzzle = useMemo(
    () => (dateKey === todayKey() ? puzzleForToday() : puzzleForDate(dateKey)),
    [dateKey],
  );
  const [board, setBoard] = useState<BoardSlots>(puzzle.starting);
  const [started, setStarted] = useState(dateKey === "tutorial");
  const [blindProg, setBlindProg] = useState(false);
  const [revealed, setRevealed] = useState<Set<PositionId>>(() => new Set());
  const [selected, setSelected] = useState<PositionId | undefined>();
  const [elapsed, setElapsed] = useState(0);
  const [swaps, setSwaps] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [tutorialOpen, setTutorialOpen] = useState(dateKey === "tutorial");
  const [recordSaved, setRecordSaved] = useState(false);
  const clueStatuses = evaluateAllClues(puzzle, board);
  const solved = clueStatuses.every(Boolean);

  useEffect(() => {
    setBoard(puzzle.starting);
    setStarted(dateKey === "tutorial");
    setBlindProg(false);
    setRevealed(new Set());
    setSelected(undefined);
    setElapsed(0);
    setSwaps(0);
    setShareOpen(false);
    setCopied(false);
    setTutorialStep(0);
    setTutorialOpen(dateKey === "tutorial");
    setRecordSaved(false);
  }, [dateKey, puzzle]);

  useEffect(() => {
    if (!started || solved || tutorialOpen) {
      return undefined;
    }
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [started, solved, tutorialOpen]);

  useEffect(() => {
    if (!started || !solved || recordSaved) {
      return;
    }

    const record: SolveRecord = {
      id: puzzle.id,
      dateKey: puzzle.dateKey,
      dateLabel: puzzle.dateLabel,
      difficulty: puzzle.difficulty,
      solved: true,
      elapsedSeconds: elapsed,
      swaps,
      easyMode: settings.easyMode,
      blindProg,
      solvedAt: new Date().toISOString(),
    };
    saveRecord(record);
    setRecordSaved(true);
    setShareOpen(true);
    onRecordsChanged();
  }, [
    blindProg,
    elapsed,
    onRecordsChanged,
    puzzle,
    recordSaved,
    settings.easyMode,
    solved,
    started,
    swaps,
  ]);

  const reset = (keepStarted = true) => {
    setBoard(puzzle.starting);
    setSelected(undefined);
    setRevealed(new Set());
    setElapsed(0);
    setSwaps(0);
    setShareOpen(false);
    setCopied(false);
    setRecordSaved(false);
    setStarted(keepStarted);
  };

  const startTutorial = () => {
    const search = new URLSearchParams({ date: "tutorial" });
    onNavigate("/", search);
  };

  const shareText = () => {
    const mode = `${settings.easyMode ? "Easy Mode" : "Classic"}${blindProg ? " Blind Prog" : ""}`;
    return [
      `Clock Spots Open ${puzzle.dateLabel} (${DIFFICULTY_LABEL[puzzle.difficulty]})`,
      `${countSatisfied(puzzle, board)}/${puzzle.clues.length} clues - ${elapsed}s - ${swaps} swaps`,
      mode.trim(),
      window.location.origin,
    ].join("\n");
  };

  return (
    <div className="app-shell">
      <Header
        dateLabel={puzzle.dateLabel}
        difficulty={puzzle.difficulty}
        elapsed={elapsed}
        swaps={swaps}
        easyMode={settings.easyMode}
        onNavigate={onNavigate}
        onArchive={onArchive}
        onReset={() => reset(true)}
        onToggleEasy={() => onSettingsChanged({ ...settings, easyMode: !settings.easyMode })}
        onTutorial={() => {
          setTutorialOpen(true);
          setTutorialStep(0);
        }}
      />

      <main className={`game-layout ${started ? "" : "prestart"}`}>
        <div className="left-rail">
          <section className="clue-summary">
            <h2>Clues</h2>
            <p>
              {clueStatuses.filter(Boolean).length}/{puzzle.clues.length} satisfied
            </p>
            {puzzle.solutionCount > 1 ? (
              <span className="muted">{puzzle.solutionCount} valid plans</span>
            ) : (
              <span className="muted">unique plan</span>
            )}
          </section>
        </div>
        <Board
          puzzle={puzzle}
          board={board}
          clueStatuses={clueStatuses}
          easyMode={settings.easyMode}
          blindProg={blindProg}
          revealedPositions={revealed}
          selectedPosition={selected}
          onReveal={(position) => setRevealed((current) => new Set(current).add(position))}
          onSelect={(position) =>
            setSelected((current) => (current === position ? undefined : position))
          }
          onSwap={(a, b) => {
            if (!started || solved) {
              return;
            }
            setBoard((current) => swapSlots(current, a, b));
            setSelected(undefined);
            setSwaps((value) => value + 1);
          }}
        />
        <OrderPanel order={puzzle.order} />
      </main>

      {!started ? (
        <StartDialog
          dateLabel={puzzle.dateLabel}
          difficultyLabel={DIFFICULTY_LABEL[puzzle.difficulty]}
          onStart={() => setStarted(true)}
          onBlind={() => {
            setBlindProg(true);
            setStarted(true);
          }}
          onTutorial={startTutorial}
        />
      ) : null}

      <TutorialModal
        open={tutorialOpen}
        step={tutorialStep}
        onStep={setTutorialStep}
        onClose={() => setTutorialOpen(false)}
      />

      <ShareDialog
        open={shareOpen}
        dateLabel={puzzle.dateLabel}
        difficulty={puzzle.difficulty}
        elapsed={elapsed}
        swaps={swaps}
        easyMode={settings.easyMode}
        blindProg={blindProg}
        copied={copied}
        onClose={() => setShareOpen(false)}
        onPlayAgain={() => reset(true)}
        onCopy={async () => {
          await navigator.clipboard?.writeText(shareText()).catch(() => undefined);
          setCopied(true);
        }}
      />

      <footer className="site-footer">
        <span>Fan-made open clone. No Clock Spots source or assets are included.</span>
        <button className="link-button" type="button" onClick={() => onNavigate("/privacy")}>
          Privacy Policy
        </button>
        <span>FFXIV visual assets are vendored from XIVPlan. © SQUARE ENIX CO., LTD.</span>
      </footer>
    </div>
  );
}

function readLocation() {
  return {
    pathname: window.location.pathname,
    search: new URLSearchParams(window.location.search),
  };
}
