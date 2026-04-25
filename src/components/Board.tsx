import { Sparkles, Zap } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { arenaImageUrl, jobIconUrl, markerIconUrl, roleIconUrl } from "../game/assets";
import { clueMechanicLabel, clueText } from "../game/clues";
import { positionOfJob } from "../game/board";
import { JOBS } from "../game/jobs";
import type { BoardSlots, JobId, PositionId, Puzzle } from "../game/types";
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
  onReveal,
  onSelect,
  onSwap,
}: BoardProps) {
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
        className="arena-board"
        style={{ "--arena-image": `url("${arenaImageUrl()}")` } as CSSProperties}
      >
        <div className="arena-grid" aria-hidden="true" />
        <TetherLayer puzzle={puzzle} board={board} />
        <FixedMarkers puzzle={puzzle} />
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
          return (
            <div
              className="clock-position"
              data-position={position}
              key={position}
              style={{ left: `${POINTS[position].x}%`, top: `${POINTS[position].y}%` }}
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
                <img
                  className="role-icon"
                  src={roleIconUrl(JOBS[job].role)}
                  alt=""
                  draggable={false}
                />
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

function TetherLayer({ puzzle, board }: { puzzle: Puzzle; board: BoardSlots }) {
  if (puzzle.markers.tethers.length === 0) {
    return null;
  }

  return (
    <svg className="tether-layer" viewBox="0 0 100 100" aria-hidden="true">
      {puzzle.markers.tethers.map((tether, index) => {
        const a = POINTS[positionOfJob(board, tether.a)];
        const b = POINTS[positionOfJob(board, tether.b)];
        return (
          <line
            key={`${tether.a}-${tether.b}-${index}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            className={`tether ${tether.kind}`}
          />
        );
      })}
    </svg>
  );
}

function FixedMarkers({ puzzle }: { puzzle: Puzzle }) {
  return (
    <>
      {puzzle.markers.addPositions.map((position) => (
        <div
          className="fixed-marker add"
          key={`add-${position}`}
          style={{ left: `${POINTS[position].x}%`, top: `${POINTS[position].y}%` }}
          title="Add"
        >
          <img src={markerIconUrl("crosshairs.png")} alt="" draggable={false} />
        </div>
      ))}
      {puzzle.markers.towerPositions.map((position) => (
        <div
          className="fixed-marker tower"
          key={`tower-${position}`}
          style={{ left: `${POINTS[position].x}%`, top: `${POINTS[position].y}%` }}
          title="Tower"
        >
          <img src={markerIconUrl("waymark_1.png")} alt="" draggable={false} />
        </div>
      ))}
      {puzzle.markers.aggroPosition ? (
        <div
          className="fixed-marker aggro"
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
      label: `Limit cut ${limit.order}`,
      content: limit.order,
      icon: markerIconUrl(`limit${limit.order}.png`),
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
