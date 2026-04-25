import { JOBS, TAG_LABELS, jobHasTag } from "./jobs";
import {
  circularDistance,
  jobAt,
  jobTagAt,
  neighborPositions,
  offsetPosition,
  positionIndex,
  positionOfJob,
  positionsInGroup,
  transformedJobPosition,
} from "./board";
import type { BoardSlots, Clue, PositionId, Puzzle, TagId, TetherMarker } from "./types";
import { POSITIONS } from "./types";

export function evaluateClue(clue: Clue, board: BoardSlots, puzzle: Puzzle): boolean {
  switch (clue.kind) {
    case "self-tag": {
      const hasTag = jobTagAt(board, clue.position, clue.tag);
      return clue.positive ? hasTag : !hasTag;
    }
    case "relative-tag": {
      const target = offsetPosition(clue.position, clue.offset);
      const hasTag = jobTagAt(board, target, clue.tag);
      return clue.positive ? hasTag : !hasTag;
    }
    case "neighbor-tag": {
      const neighbors = neighborPositions(clue.position);
      const count = neighbors.filter((position) => jobTagAt(board, position, clue.tag)).length;
      if (clue.mode === "both") {
        return count === 2;
      }
      if (clue.mode === "neither") {
        return count === 0;
      }
      return count >= 1;
    }
    case "group-count": {
      const count = positionsInGroup(clue.group).filter((position) =>
        jobTagAt(board, position, clue.tag),
      ).length;
      if (clue.comparator === "at-least") {
        return count >= clue.count;
      }
      if (clue.comparator === "at-most") {
        return count <= clue.count;
      }
      return count === clue.count;
    }
    case "mechanic":
      return evaluateMechanic(clue.mechanic, board, puzzle);
  }
}

export function evaluateAllClues(puzzle: Puzzle, board: BoardSlots): boolean[] {
  return puzzle.clues.map((clue) => evaluateClue(clue, board, puzzle));
}

export function clueText(clue: Clue): string {
  switch (clue.kind) {
    case "self-tag":
      return clue.positive
        ? `I am ${TAG_LABELS[clue.tag].noun}`
        : `I am not ${TAG_LABELS[clue.tag].noun}`;
    case "relative-tag":
      return `The player ${offsetText(clue.offset)} from me ${TAG_LABELS[clue.tag].verbSingular}`;
    case "neighbor-tag": {
      if (clue.mode === "both") {
        return `Both of my neighbors ${TAG_LABELS[clue.tag].verbPlural}`;
      }
      if (clue.mode === "neither") {
        return `Neither of my neighbors ${TAG_LABELS[clue.tag].verbSingular}`;
      }
      return `One of my neighbors ${TAG_LABELS[clue.tag].verbSingular}`;
    }
    case "group-count":
      return `${comparatorText(clue.comparator)} ${clue.count} ${groupText(clue.group)} players ${TAG_LABELS[clue.tag].verbPlural}`;
    case "mechanic":
      return mechanicText(clue.mechanic);
  }
}

export function mechanicText(mechanic: Extract<Clue, { kind: "mechanic" }>["mechanic"]): string {
  switch (mechanic) {
    case "boss-aggro":
      return "The player holding boss aggro must be a tank";
    case "vuln-dodge":
      return "Players with Vulnerability Up must dodge the boss cleave";
    case "proximity":
      return "Near tethers must be close and far tethers must be stretched";
    case "tethers-no-intersect":
      return "Orange tethers must not cross each other";
    case "tethers-parallel":
      return "Orange tethers must be parallel";
    case "flare-spread":
      return "Flares must not be adjacent to each other";
    case "healing":
      return "Low HP players must be next to a healer";
    case "hello-world":
      return "The red bug must have both blue bugs as neighbors";
    case "tower-soak":
      return "Tower players must be supports";
    case "limit-cut":
      return "Limit cut numbers must form a clockwise 1-2-3-4 loop";
    case "rescue":
      return "Rescue targets must have a healer directly across";
    case "add-damage":
      return "Every add must be covered by nearby DPS";
    case "stack":
      return "The stack marker needs a support neighbor";
  }
}

export function clueMechanicLabel(clue: Clue): string {
  if (clue.kind === "mechanic") {
    return clue.mechanic
      .split("-")
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join(" ");
  }
  return "Position clue";
}

function offsetText(offset: number): string {
  const abs = Math.abs(offset);
  if (abs === 4) {
    return "across";
  }
  const direction = offset > 0 ? "clockwise" : "counter-clockwise";
  return abs === 1 ? direction : `${abs} ${direction}`;
}

function comparatorText(comparator: Extract<Clue, { kind: "group-count" }>["comparator"]): string {
  if (comparator === "at-least") {
    return "At least";
  }
  if (comparator === "at-most") {
    return "At most";
  }
  return "Exactly";
}

function groupText(group: Extract<Clue, { kind: "group-count" }>["group"]): string {
  if (group === "all") {
    return "clock";
  }
  return group;
}

function evaluateMechanic(
  mechanic: Extract<Clue, { kind: "mechanic" }>["mechanic"],
  board: BoardSlots,
  puzzle: Puzzle,
): boolean {
  switch (mechanic) {
    case "boss-aggro":
      return puzzle.markers.aggroPosition
        ? JOBS[jobAt(board, puzzle.markers.aggroPosition)].role === "tank"
        : true;
    case "vuln-dodge":
      return puzzle.markers.vulnJobs.every((job) => {
        const position = transformedJobPosition(board, job, puzzle.knockback);
        return !puzzle.cleaveHits.includes(position);
      });
    case "proximity":
      return puzzle.markers.tethers
        .filter((tether) => tether.kind !== "orange")
        .every((tether) => proximitySatisfied(tether, board, puzzle));
    case "tethers-no-intersect": {
      const orangeTethers = puzzle.markers.tethers.filter((tether) => tether.kind === "orange");
      return orangeTethers.every((tether, index) =>
        orangeTethers.slice(index + 1).every((other) => !tethersIntersect(tether, other, board)),
      );
    }
    case "tethers-parallel": {
      const orangeTethers = puzzle.markers.tethers.filter((tether) => tether.kind === "orange");
      if (orangeTethers.length < 2) {
        return true;
      }
      const firstOffset = tetherOffset(orangeTethers[0], board);
      return orangeTethers.every((tether) => tetherOffset(tether, board) === firstOffset);
    }
    case "flare-spread":
      return puzzle.markers.flareJobs.every((job, index) =>
        puzzle.markers.flareJobs.slice(index + 1).every((other) => {
          const a = positionOfJob(board, job);
          const b = positionOfJob(board, other);
          return circularDistance(a, b) > 1;
        }),
      );
    case "healing":
      return puzzle.markers.lowHpJobs.every((job) => {
        const position = positionOfJob(board, job);
        return neighborPositions(position).some(
          (neighbor) => JOBS[jobAt(board, neighbor)].role === "healer",
        );
      });
    case "hello-world":
      return puzzle.markers.redBugJobs.every((job) => {
        const position = positionOfJob(board, job);
        return neighborPositions(position).every((neighbor) => {
          const neighborJob = jobAt(board, neighbor);
          return puzzle.markers.blueBugJobs.includes(neighborJob);
        });
      });
    case "tower-soak":
      return puzzle.markers.towerPositions.every((position) => {
        const role = JOBS[jobAt(board, position)].role;
        return role === "tank" || role === "healer";
      });
    case "limit-cut": {
      const sorted = [...puzzle.markers.limitCut].sort((a, b) => a.order - b.order);
      if (sorted.length < 2) {
        return true;
      }
      const indices = sorted.map((marker) => positionIndex(positionOfJob(board, marker.job)));
      const rotations = indices.map((start, index) => {
        const next = indices[(index + 1) % indices.length];
        return (next - start + POSITIONS.length) % POSITIONS.length;
      });
      return rotations.every((steps) => steps > 0 && steps <= 3);
    }
    case "rescue":
      return puzzle.markers.rescueJobs.every((job) => {
        const position = positionOfJob(board, job);
        const rescuingPosition = offsetPosition(position, puzzle.rescueOffset);
        return JOBS[jobAt(board, rescuingPosition)].role === "healer";
      });
    case "add-damage":
      return puzzle.markers.addPositions.every((addPosition) => {
        const positions = [addPosition, ...neighborPositions(addPosition)];
        return positions.some((position) => JOBS[jobAt(board, position)].role === "dps");
      });
    case "stack": {
      if (!puzzle.markers.stackJob) {
        return true;
      }
      const stackPosition = positionOfJob(board, puzzle.markers.stackJob);
      return neighborPositions(stackPosition).some((position) => {
        const role = JOBS[jobAt(board, position)].role;
        return role === "tank" || role === "healer";
      });
    }
  }
}

function proximitySatisfied(tether: TetherMarker, board: BoardSlots, puzzle: Puzzle): boolean {
  const a = transformedJobPosition(board, tether.a, puzzle.knockback);
  const b = transformedJobPosition(board, tether.b, puzzle.knockback);
  const distance = circularDistance(a, b);
  return tether.kind === "near" ? distance <= 1 : distance >= 3;
}

function tetherOffset(tether: TetherMarker, board: BoardSlots): number {
  const a = positionIndex(positionOfJob(board, tether.a));
  const b = positionIndex(positionOfJob(board, tether.b));
  const clockwise = (b - a + POSITIONS.length) % POSITIONS.length;
  return Math.min(clockwise, POSITIONS.length - clockwise);
}

function tethersIntersect(a: TetherMarker, b: TetherMarker, board: BoardSlots): boolean {
  const a1 = positionIndex(positionOfJob(board, a.a));
  const a2 = positionIndex(positionOfJob(board, a.b));
  const b1 = positionIndex(positionOfJob(board, b.a));
  const b2 = positionIndex(positionOfJob(board, b.b));

  if ([a1, a2].includes(b1) || [a1, a2].includes(b2)) {
    return false;
  }

  return endpointsInterleave(a1, a2, b1, b2) || endpointsInterleave(b1, b2, a1, a2);
}

function endpointsInterleave(a: number, b: number, c: number, d: number): boolean {
  const normalizedB = (b - a + POSITIONS.length) % POSITIONS.length;
  const normalizedC = (c - a + POSITIONS.length) % POSITIONS.length;
  const normalizedD = (d - a + POSITIONS.length) % POSITIONS.length;
  return normalizedC > 0 && normalizedC < normalizedB && normalizedD > normalizedB;
}

export function tagTrueAtSolution(position: PositionId, tag: TagId, solution: BoardSlots): boolean {
  return jobHasTag(solution[position], tag);
}

export function clueKey(clue: Clue): string {
  return `${clue.kind}:${JSON.stringify(clue)}`;
}

export function countSatisfied(puzzle: Puzzle, board: BoardSlots): number {
  return evaluateAllClues(puzzle, board).filter(Boolean).length;
}

export function solved(puzzle: Puzzle, board: BoardSlots): boolean {
  return countSatisfied(puzzle, board) === puzzle.clues.length;
}
