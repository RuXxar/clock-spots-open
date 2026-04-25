import { Sparkles, Zap } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { arenaImageUrl, jobIconUrl, markerIconUrl } from "../game/assets";
import {
  applyKnockback,
  jobAt,
  offsetPosition,
  positionOfJob,
  positionsInGroup,
} from "../game/board";
import { clueMechanicLabel, clueText } from "../game/clues";
import { JOBS } from "../game/jobs";
import { operationKind, type OperationKind } from "../game/operations";
import type { BoardSlots, JobId, PositionGroup, PositionId, Puzzle } from "../game/types";
import { POSITIONS } from "../game/types";

const POINTS: Record<PositionId, { x: number; y: number }> = {
  N: { x: 50, y: 11 },
  NE: { x: 78, y: 22 },
  E: { x: 89, y: 50 },
  SE: { x: 78, y: 78 },
  S: { x: 50, y: 89 },
  SW: { x: 22, y: 78 },
  W: { x: 11, y: 50 },
  NW: { x: 22, y: 22 },
};

interface BoardProps {
  puzzle: Puzzle;
  board: BoardSlots;
  clueStatuses: boolean[];
  easyMode: boolean;
  blindProg: boolean;
  revealedPositions: Set<PositionId>;
  selectedPosition?: PositionId;
  activeOperation?: string;
  onReveal(position: PositionId): void;
  onSelect(position: PositionId): void;
  onSwap(a: PositionId, b: PositionId): void;
}

export function Board({
  puzzle,
  board,
  clueStatuses,
  easyMode,
  blindProg,
  revealedPositions,
  selectedPosition,
  activeOperation,
  onReveal,
  onSelect,
  onSwap,
}: BoardProps) {
  const activeKind = operationKind(activeOperation);
  const focusedJobs = focusedJobsForOperation(activeKind, puzzle, board);
  const focusedPositions = focusedPositionsForOperation(activeKind, puzzle, board);
  const hasFocus = focusedJobs.size > 0 || focusedPositions.size > 0;

  const handleClick = (position: PositionId) => {
    onReveal(position);
    if (selectedPosition && selectedPosition !== position) {
      onSwap(selectedPosition, position);
      return;
    }
    onSelect(position);
  };

  return (
    <section className="board-shell" aria-label="Clock spots board">
      <div
        className={`arena-board ${activeOperation ? "operation-preview" : ""}`}
        style={{ "--arena-image": `url("${arenaImageUrl()}")` } as CSSProperties}
      >
        <div className="arena-grid" aria-hidden="true" />
        <OperationOverlay puzzle={puzzle} board={board} activeKind={activeKind} />
        <TetherLayer puzzle={puzzle} board={board} activeKind={activeKind} />
        <FixedMarkers puzzle={puzzle} activeKind={activeKind} />
        <div className="center-score" aria-live="polite">
          <strong>
            {clueStatuses.filter(Boolean).length}/{puzzle.clues.length}
          </strong>
          <span>clues satisfied</span>
        </div>
        {POSITIONS.map((position) => {
          const job = board[position];
          const clue = puzzle.clues.find((item) => item.position === position);
          const clueIndex = clue ? puzzle.clues.indexOf(clue) : -1;
          const visible = !blindProg || revealedPositions.has(position);
          const satisfied = clueIndex >= 0 ? clueStatuses[clueIndex] : false;
          const displayPosition = displayPositionForOperation(position, activeKind, puzzle);
          const focused = focusedJobs.has(job) || focusedPositions.has(position);
          const dimmed = hasFocus && !focused;
          const moved = displayPosition !== position;
          return (
            <div
              className={`clock-position ${focused ? "operation-focus" : ""} ${dimmed ? "operation-dimmed" : ""} ${
                moved ? "operation-moved" : ""
              }`}
              data-position={position}
              key={position}
              style={{
                left: `${POINTS[displayPosition].x}%`,
                top: `${POINTS[displayPosition].y}%`,
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const source = event.dataTransfer.getData("text/clock-position") as PositionId;
                if (source && source !== position) {
                  onReveal(position);
                  onSwap(source, position);
                }
              }}
            >
              <button
                className={`job-token ${JOBS[job].color} ${selectedPosition === position ? "selected" : ""}`}
                type="button"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData("text/clock-position", position);
                  event.dataTransfer.effectAllowed = "move";
                }}
                onClick={() => handleClick(position)}
                title={`${JOBS[job].name} at ${position}`}
              >
                <MarkerStack puzzle={puzzle} job={job} />
                <img className="job-icon" src={jobIconUrl(job)} alt="" draggable={false} />
                <span className="job-abbrev">{job}</span>
              </button>
              {clue ? (
                <p
                  className={`slot-clue ${easyMode ? (satisfied ? "satisfied" : "unsatisfied") : ""} ${
                    visible ? "" : "hidden-clue"
                  }`}
                  title={clueMechanicLabel(clue)}
                >
                  {visible ? `"${clueText(clue)}"` : "???"}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function OperationOverlay({
  puzzle,
  board,
  activeKind,
}: {
  puzzle: Puzzle;
  board: BoardSlots;
  activeKind: OperationKind;
}) {
  return (
    <>
      <CleaveZone puzzle={puzzle} activeKind={activeKind} />
      <KnockbackVectors puzzle={puzzle} activeKind={activeKind} />
      <LimitCutSequence puzzle={puzzle} board={board} activeKind={activeKind} />
      <BugPairLinks puzzle={puzzle} board={board} activeKind={activeKind} />
    </>
  );
}

function CleaveZone({ puzzle, activeKind }: { puzzle: Puzzle; activeKind: OperationKind }) {
  if (activeKind !== "boss-cleave" || puzzle.cleaveHits.length === 0) {
    return null;
  }

  return <div className={`cleave-zone ${cleaveGroup(puzzle.cleaveHits)}`} aria-hidden="true" />;
}

function KnockbackVectors({ puzzle, activeKind }: { puzzle: Puzzle; activeKind: OperationKind }) {
  if (activeKind !== "knockback" || !puzzle.knockback) {
    return null;
  }

  const paths = POSITIONS.map((position) => {
    const target = applyKnockback(position, puzzle.knockback);
    return target === position ? undefined : { from: position, to: target };
  }).filter(Boolean) as Array<{ from: PositionId; to: PositionId }>;

  if (paths.length === 0) {
    return null;
  }

  return (
    <svg className="knockback-layer" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <marker
          id="knockback-arrow"
          markerWidth="5"
          markerHeight="5"
          refX="4"
          refY="2.5"
          orient="auto"
        >
          <path d="M0,0 L5,2.5 L0,5 Z" />
        </marker>
      </defs>
      {paths.map(({ from, to }) => (
        <line
          className="knockback-vector"
          key={`${from}-${to}`}
          x1={POINTS[from].x}
          y1={POINTS[from].y}
          x2={POINTS[to].x}
          y2={POINTS[to].y}
          markerEnd="url(#knockback-arrow)"
        />
      ))}
    </svg>
  );
}

function LimitCutSequence({
  puzzle,
  board,
  activeKind,
}: {
  puzzle: Puzzle;
  board: BoardSlots;
  activeKind: OperationKind;
}) {
  if (activeKind !== "limit-cut" || puzzle.markers.limitCut.length < 2) {
    return null;
  }

  const sequence = [...puzzle.markers.limitCut].sort((a, b) => a.order - b.order);

  return (
    <svg className="mechanic-guide-layer limit-cut-layer" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <marker
          id="limit-cut-arrow"
          markerWidth="5"
          markerHeight="5"
          refX="4"
          refY="2.5"
          orient="auto"
        >
          <path d="M0,0 L5,2.5 L0,5 Z" />
        </marker>
      </defs>
      {sequence.map((marker, index) => {
        const next = sequence[(index + 1) % sequence.length];
        const from = POINTS[positionOfJob(board, marker.job)];
        const to = POINTS[positionOfJob(board, next.job)];
        return (
          <line
            className="limit-cut-link"
            key={`${marker.job}-${next.job}`}
            markerEnd="url(#limit-cut-arrow)"
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
          />
        );
      })}
    </svg>
  );
}

function BugPairLinks({
  puzzle,
  board,
  activeKind,
}: {
  puzzle: Puzzle;
  board: BoardSlots;
  activeKind: OperationKind;
}) {
  if (
    activeKind !== "hello-world" ||
    puzzle.markers.redBugJobs.length === 0 ||
    puzzle.markers.blueBugJobs.length === 0
  ) {
    return null;
  }

  return (
    <svg className="mechanic-guide-layer bug-pair-layer" viewBox="0 0 100 100" aria-hidden="true">
      {puzzle.markers.redBugJobs.flatMap((redJob) => {
        const red = POINTS[positionOfJob(board, redJob)];
        return puzzle.markers.blueBugJobs.map((blueJob) => {
          const blue = POINTS[positionOfJob(board, blueJob)];
          return (
            <line
              className="bug-pair-link"
              key={`${redJob}-${blueJob}`}
              x1={red.x}
              y1={red.y}
              x2={blue.x}
              y2={blue.y}
            />
          );
        });
      })}
    </svg>
  );
}

function TetherLayer({
  puzzle,
  board,
  activeKind,
}: {
  puzzle: Puzzle;
  board: BoardSlots;
  activeKind: OperationKind;
}) {
  if (puzzle.markers.tethers.length === 0) {
    return null;
  }

  return (
    <svg className="tether-layer" viewBox="0 0 100 100" aria-hidden="true">
      {puzzle.markers.tethers.map((tether, index) => {
        const a = POINTS[positionOfJob(board, tether.a)];
        const b = POINTS[positionOfJob(board, tether.b)];
        const active = tetherActiveForOperation(tether.kind, activeKind);
        const muted = activeKind !== "unknown" && activeKind !== "return" && !active;
        return (
          <line
            key={`${tether.a}-${tether.b}-${index}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            className={`tether ${tether.kind} ${active ? "active" : ""} ${muted ? "muted" : ""}`}
          />
        );
      })}
    </svg>
  );
}

function FixedMarkers({ puzzle, activeKind }: { puzzle: Puzzle; activeKind: OperationKind }) {
  const highlightAggro = activeKind === "tank-buster";
  const highlightTowers = activeKind === "tower-soak";
  const highlightAdds = activeKind === "add-damage";

  return (
    <>
      {puzzle.markers.addPositions.map((position) => (
        <div
          className={`fixed-marker add ${highlightAdds ? "operation-focus" : ""}`}
          key={`add-${position}`}
          style={{ left: `${POINTS[position].x}%`, top: `${POINTS[position].y}%` }}
          title="Add"
        >
          <img src={markerIconUrl("crosshairs.png")} alt="" draggable={false} />
        </div>
      ))}
      {puzzle.markers.towerPositions.map((position) => (
        <div
          className={`fixed-marker tower ${highlightTowers ? "operation-focus" : ""}`}
          key={`tower-${position}`}
          style={{ left: `${POINTS[position].x}%`, top: `${POINTS[position].y}%` }}
          title="Tower"
        >
          <img src={markerIconUrl("waymark_1.png")} alt="" draggable={false} />
        </div>
      ))}
      {puzzle.markers.aggroPosition ? (
        <div
          className={`fixed-marker aggro ${highlightAggro ? "operation-focus" : ""}`}
          style={{
            left: `${POINTS[puzzle.markers.aggroPosition].x}%`,
            top: `${POINTS[puzzle.markers.aggroPosition].y}%`,
          }}
          title="Boss aggro"
        >
          <img src={markerIconUrl("attack1.png")} alt="" draggable={false} />
        </div>
      ) : null}
    </>
  );
}

function displayPositionForOperation(
  position: PositionId,
  activeKind: OperationKind,
  puzzle: Puzzle,
): PositionId {
  return activeKind === "knockback" ? applyKnockback(position, puzzle.knockback) : position;
}

function focusedJobsForOperation(
  activeKind: OperationKind,
  puzzle: Puzzle,
  board: BoardSlots,
): Set<JobId> {
  switch (activeKind) {
    case "knockback":
      return new Set(
        POSITIONS.filter((position) => applyKnockback(position, puzzle.knockback) !== position).map(
          (position) => jobAt(board, position),
        ),
      );
    case "boss-cleave":
      return new Set(puzzle.markers.vulnJobs);
    case "tank-buster":
      return new Set(
        puzzle.markers.aggroPosition ? [jobAt(board, puzzle.markers.aggroPosition)] : [],
      );
    case "proximity-near":
      return tetherJobs(puzzle, "near");
    case "proximity-far":
      return tetherJobs(puzzle, "far");
    case "orange-tethers":
      return tetherJobs(puzzle, "orange");
    case "flare-spread":
      return new Set(puzzle.markers.flareJobs);
    case "tower-soak":
      return new Set(puzzle.markers.towerPositions.map((position) => jobAt(board, position)));
    case "limit-cut":
      return new Set(puzzle.markers.limitCut.map((marker) => marker.job));
    case "add-damage":
      return new Set(
        puzzle.markers.addPositions.flatMap((position) =>
          [position, ...neighborPositionsForBoard(position)].map((nearby) => jobAt(board, nearby)),
        ),
      );
    case "stack":
      return new Set(puzzle.markers.stackJob ? [puzzle.markers.stackJob] : []);
    case "hello-world":
      return new Set([...puzzle.markers.redBugJobs, ...puzzle.markers.blueBugJobs]);
    case "healing":
      return new Set([
        ...puzzle.markers.lowHpJobs,
        ...puzzle.markers.lowHpJobs.map((job) =>
          jobAt(board, offsetPosition(positionOfJob(board, job), puzzle.rescueOffset)),
        ),
      ]);
    case "return":
    case "check-clues":
    case "unknown":
      return new Set();
  }
}

function focusedPositionsForOperation(
  activeKind: OperationKind,
  puzzle: Puzzle,
  board: BoardSlots,
): Set<PositionId> {
  switch (activeKind) {
    case "boss-cleave":
      return new Set(puzzle.cleaveHits);
    case "tank-buster":
      return new Set(puzzle.markers.aggroPosition ? [puzzle.markers.aggroPosition] : []);
    case "tower-soak":
      return new Set(puzzle.markers.towerPositions);
    case "add-damage":
      return new Set(puzzle.markers.addPositions);
    case "return":
      return new Set(POSITIONS);
    case "check-clues":
      return new Set(puzzle.clues.map((clue) => clue.position));
    case "healing":
      return new Set(puzzle.markers.lowHpJobs.map((job) => positionOfJob(board, job)));
    case "knockback":
    case "proximity-near":
    case "proximity-far":
    case "orange-tethers":
    case "flare-spread":
    case "limit-cut":
    case "stack":
    case "hello-world":
    case "unknown":
      return new Set();
  }
}

function tetherJobs(puzzle: Puzzle, kind: "near" | "far" | "orange"): Set<JobId> {
  return new Set(
    puzzle.markers.tethers
      .filter((tether) => tether.kind === kind)
      .flatMap((tether) => [tether.a, tether.b]),
  );
}

function tetherActiveForOperation(
  tetherKind: "near" | "far" | "orange",
  activeKind: OperationKind,
): boolean {
  if (activeKind === "proximity-near") {
    return tetherKind === "near";
  }
  if (activeKind === "proximity-far") {
    return tetherKind === "far";
  }
  if (activeKind === "orange-tethers") {
    return tetherKind === "orange";
  }
  return false;
}

function cleaveGroup(cleaveHits: PositionId[]): PositionGroup {
  const groups: PositionGroup[] = ["north", "south", "east", "west"];
  return (
    groups.find((group) => {
      const positions = positionsInGroup(group);
      return cleaveHits.every((position) => positions.includes(position));
    }) ?? "all"
  );
}

function neighborPositionsForBoard(position: PositionId): [PositionId, PositionId] {
  return [offsetPosition(position, -1), offsetPosition(position, 1)];
}

function MarkerStack({ puzzle, job }: { puzzle: Puzzle; job: JobId }) {
  const markers: Array<{
    key: string;
    className: string;
    label: string;
    content: ReactNode;
    icon?: string;
  }> = [];

  if (puzzle.markers.vulnJobs.includes(job)) {
    markers.push({
      key: "vuln",
      className: "vuln",
      label: "Vulnerability Up",
      content: <Zap size={13} />,
      icon: markerIconUrl("red_target.png"),
    });
  }
  if (puzzle.markers.flareJobs.includes(job)) {
    markers.push({
      key: "flare",
      className: "flare",
      label: "Flare",
      content: <Sparkles size={13} />,
      icon: markerIconUrl("crosshairs.png"),
    });
  }
  if (puzzle.markers.lowHpJobs.includes(job)) {
    markers.push({
      key: "low-hp",
      className: "low-hp",
      label: "Low HP",
      content: "HP",
      icon: markerIconUrl("green_target.png"),
    });
  }
  if (puzzle.markers.redBugJobs.includes(job)) {
    markers.push({
      key: "red-bug",
      className: "red-bug",
      label: "Red bug",
      content: "R",
      icon: markerIconUrl("eden/orange.png"),
    });
  }
  if (puzzle.markers.blueBugJobs.includes(job)) {
    markers.push({
      key: "blue-bug",
      className: "blue-bug",
      label: "Blue bug",
      content: "B",
      icon: markerIconUrl("eden/blue.png"),
    });
  }
  if (puzzle.markers.stackJob === job) {
    markers.push({
      key: "stack",
      className: "stack",
      label: "Stack marker",
      content: "ST",
      icon: markerIconUrl("circle.png"),
    });
  }

  const limit = puzzle.markers.limitCut.find((marker) => marker.job === job);
  if (limit) {
    markers.push({
      key: "limit",
      className: "limit",
      label: `Limit cut ${limit.order}: resolves in clockwise number order`,
      content: limit.order,
      icon: markerIconUrl(`attack${limit.order}.png`),
    });
  }

  if (markers.length === 0) {
    return null;
  }

  return (
    <span className="marker-stack">
      {markers.map((marker) => (
        <span className={`token-marker ${marker.className}`} key={marker.key} title={marker.label}>
          {marker.icon ? <img src={marker.icon} alt="" draggable={false} /> : marker.content}
        </span>
      ))}
    </span>
  );
}
