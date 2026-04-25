import { addDays, formatDateLabel, getEasternDateKey, parseDateKey } from "./date";
import {
  applyKnockback,
  boardFromJobs,
  circularDistance,
  neighborPositions,
  offsetPosition,
  positionOfJob,
  positionsInGroup,
  sameBoard,
} from "./board";
import { evaluateClue, evaluateAllClues, clueKey } from "./clues";
import { JOBS, jobHasTag, jobsByDamageRole, jobsByRole, usefulTagsForJob } from "./jobs";
import { createRng } from "./random";
import type {
  BoardSlots,
  Clue,
  DifficultyId,
  JobId,
  KnockbackDirection,
  PositionGroup,
  PositionId,
  Puzzle,
  PuzzleMarkers,
  TagId,
} from "./types";
import { POSITIONS } from "./types";

const FIRST_DAILY = "2026-04-17";

const DIFFICULTIES: DifficultyId[] = ["normal", "extreme", "savage", "ultimate"];
const puzzleCache = new Map<string, Puzzle>();

const MECHANIC_BY_DIFFICULTY: Record<
  DifficultyId,
  Array<Extract<Clue, { kind: "mechanic" }>["mechanic"]>
> = {
  normal: ["boss-aggro", "stack", "healing"],
  extreme: ["boss-aggro", "vuln-dodge", "proximity", "flare-spread", "stack"],
  savage: [
    "vuln-dodge",
    "proximity",
    "healing",
    "tethers-no-intersect",
    "add-damage",
    "tower-soak",
  ],
  ultimate: [
    "vuln-dodge",
    "proximity",
    "tethers-no-intersect",
    "tethers-parallel",
    "flare-spread",
    "healing",
    "hello-world",
    "limit-cut",
    "rescue",
    "add-damage",
  ],
};

export function todayKey(): string {
  return getEasternDateKey();
}

export function firstDailyKey(): string {
  return FIRST_DAILY;
}

export function puzzleForToday(): Puzzle {
  return puzzleForDate(todayKey());
}

export function puzzleForDate(dateKey: string): Puzzle {
  const cached = puzzleCache.get(dateKey);
  if (cached) {
    return cached;
  }

  if (dateKey === "tutorial") {
    const puzzle = tutorialPuzzle();
    puzzleCache.set(dateKey, puzzle);
    return puzzle;
  }

  const rng = createRng(`clock-spots-open:${dateKey}`);
  const dayNumber = daysSinceFirst(dateKey);
  const difficulty = DIFFICULTIES[Math.abs(dayNumber) % DIFFICULTIES.length];
  const selectedJobs = selectParty(rng);
  const solution = boardFromJobs(rng.shuffle(selectedJobs));
  const mechanics = rng
    .shuffle(MECHANIC_BY_DIFFICULTY[difficulty])
    .slice(0, mechanicCount(difficulty));
  const markers = createMarkers(rng, solution, selectedJobs, mechanics);
  const knockback =
    mechanics.includes("vuln-dodge") || mechanics.includes("proximity")
      ? rng.pick<KnockbackDirection>(["north", "south", "east", "west"])
      : undefined;
  const cleaveHits = createCleaveHits(rng, solution, markers.vulnJobs, knockback);
  const rescueOffset = 4;

  const puzzleBase: Omit<Puzzle, "clues" | "starting" | "solutionCount"> = {
    id: dateKey,
    dateKey,
    dateLabel: formatDateLabel(dateKey),
    difficulty,
    solution,
    selectedJobs,
    markers,
    order: createOrder(mechanics, Boolean(knockback)),
    knockback,
    cleaveHits,
    rescueOffset,
  };

  const pool = buildCluePool(rng, puzzleBase);
  const { clues, solutionCount } = chooseClues(rng, puzzleBase, pool, mechanics);
  const puzzleWithSolution: Puzzle = {
    ...puzzleBase,
    clues,
    starting: solution,
    solutionCount,
  };
  const starting = createStartingBoard(rng, selectedJobs, puzzleWithSolution);

  const puzzle = {
    ...puzzleWithSolution,
    starting,
  };
  puzzleCache.set(dateKey, puzzle);
  return puzzle;
}

export function archiveDatesThroughToday(): string[] {
  const today = todayKey();
  const dates: string[] = [];
  for (let date = FIRST_DAILY; date <= today; date = addDays(date, 1)) {
    dates.push(date);
  }
  return dates;
}

function daysSinceFirst(dateKey: string): number {
  const first = parseDateKey(FIRST_DAILY).getTime();
  const current = parseDateKey(dateKey).getTime();
  return Math.round((current - first) / 86_400_000);
}

function mechanicCount(difficulty: DifficultyId): number {
  switch (difficulty) {
    case "normal":
      return 1;
    case "extreme":
      return 2;
    case "savage":
      return 3;
    case "ultimate":
      return 5;
  }
}

function selectParty(rng: ReturnType<typeof createRng>): JobId[] {
  const tanks = rng.shuffle(jobsByRole("tank")).slice(0, 2);
  const healers = rng.shuffle(jobsByRole("healer")).slice(0, 2);
  const melee = rng.pick(jobsByDamageRole("melee"));
  const physical = rng.pick(jobsByDamageRole("physical-ranged"));
  const casters = rng.shuffle(jobsByDamageRole("caster")).slice(0, 2);
  const extras = rng
    .shuffle([
      ...jobsByDamageRole("melee"),
      ...jobsByDamageRole("physical-ranged"),
      ...jobsByDamageRole("caster"),
    ])
    .filter((job) => ![melee, physical, ...casters].includes(job));

  return [...tanks, ...healers, melee, physical, ...casters, ...extras].slice(0, 8);
}

function createMarkers(
  rng: ReturnType<typeof createRng>,
  solution: BoardSlots,
  selectedJobs: JobId[],
  mechanics: Array<Extract<Clue, { kind: "mechanic" }>["mechanic"]>,
): PuzzleMarkers {
  const positionJobs = (positions: PositionId[]) => positions.map((position) => solution[position]);
  const tankPositions = POSITIONS.filter((position) => JOBS[solution[position]].role === "tank");
  const supportPositions = POSITIONS.filter((position) => JOBS[solution[position]].role !== "dps");
  const dpsPositions = POSITIONS.filter((position) => JOBS[solution[position]].role === "dps");
  const nonAdjacentPairs = allPositionPairs().filter(([a, b]) => circularDistance(a, b) > 1);
  const adjacentPairs = allPositionPairs().filter(([a, b]) => circularDistance(a, b) === 1);
  const farPairs = allPositionPairs().filter(([a, b]) => circularDistance(a, b) >= 3);

  const markers: PuzzleMarkers = {
    aggroPosition: mechanics.includes("boss-aggro") ? rng.pick(tankPositions) : undefined,
    vulnJobs: mechanics.includes("vuln-dodge") ? positionJobs(rng.pick(nonAdjacentPairs)) : [],
    flareJobs: mechanics.includes("flare-spread") ? positionJobs(rng.pick(nonAdjacentPairs)) : [],
    lowHpJobs:
      mechanics.includes("healing") || mechanics.includes("rescue")
        ? positionJobs(
            rng
              .shuffle(
                POSITIONS.filter((position) =>
                  neighborPositions(position).some(
                    (neighbor) => JOBS[solution[neighbor]].role === "healer",
                  ),
                ),
              )
              .slice(0, 2),
          )
        : [],
    redBugJobs: [],
    blueBugJobs: [],
    towerPositions: mechanics.includes("tower-soak")
      ? rng.shuffle(supportPositions).slice(0, 2)
      : [],
    stackJob: mechanics.includes("stack")
      ? solution[
          rng.pick(
            POSITIONS.filter((position) =>
              neighborPositions(position).some(
                (neighbor) => JOBS[solution[neighbor]].role !== "dps",
              ),
            ),
          )
        ]
      : undefined,
    tethers: [],
    limitCut: [],
    addPositions: mechanics.includes("add-damage") ? rng.shuffle(dpsPositions).slice(0, 2) : [],
  };

  if (mechanics.includes("proximity")) {
    const near = rng.pick(adjacentPairs);
    const far = rng.pick(farPairs.filter(([a, b]) => !near.includes(a) && !near.includes(b)));
    markers.tethers.push({ a: solution[near[0]], b: solution[near[1]], kind: "near" });
    markers.tethers.push({ a: solution[far[0]], b: solution[far[1]], kind: "far" });
  }

  if (mechanics.includes("tethers-no-intersect") || mechanics.includes("tethers-parallel")) {
    const pairA = rng.pick(nonAdjacentPairs);
    const pairB =
      mechanics.includes("tethers-parallel") && circularDistance(pairA[0], pairA[1]) < 4
        ? ([
            POSITIONS[(POSITIONS.indexOf(pairA[0]) + 2) % 8],
            POSITIONS[(POSITIONS.indexOf(pairA[1]) + 2) % 8],
          ] as [PositionId, PositionId])
        : rng.pick(
            nonAdjacentPairs.filter((pair) => pair.every((position) => !pairA.includes(position))),
          );
    markers.tethers.push({ a: solution[pairA[0]], b: solution[pairA[1]], kind: "orange" });
    markers.tethers.push({ a: solution[pairB[0]], b: solution[pairB[1]], kind: "orange" });
  }

  if (mechanics.includes("hello-world")) {
    const redPosition = rng.pick(POSITIONS);
    markers.redBugJobs = [solution[redPosition]];
    markers.blueBugJobs = positionJobs(neighborPositions(redPosition));
  }

  if (mechanics.includes("limit-cut")) {
    markers.limitCut = rng
      .shuffle(POSITIONS)
      .slice(0, 4)
      .sort((a, b) => POSITIONS.indexOf(a) - POSITIONS.indexOf(b))
      .map((position, index) => ({ job: solution[position], order: index + 1 }));
  }

  if (markers.lowHpJobs.length === 0 && mechanics.includes("rescue")) {
    markers.lowHpJobs = [rng.pick(selectedJobs)];
  }

  return markers;
}

function createCleaveHits(
  rng: ReturnType<typeof createRng>,
  solution: BoardSlots,
  vulnJobs: JobId[],
  knockback?: KnockbackDirection,
): PositionId[] {
  const groups: PositionGroup[] = ["north", "south", "east", "west"];
  const safeGroups = groups.filter((group) =>
    vulnJobs.every((job) => {
      const position = applyKnockback(positionOfJob(solution, job), knockback);
      return !positionsInGroup(group).includes(position);
    }),
  );
  return positionsInGroup(rng.pick(safeGroups.length > 0 ? safeGroups : groups));
}

function createOrder(
  mechanics: Array<Extract<Clue, { kind: "mechanic" }>["mechanic"]>,
  hasKnockback: boolean,
): string[] {
  const order = [];
  if (hasKnockback) {
    order.push("Knockback");
  }
  if (mechanics.includes("vuln-dodge")) {
    order.push("Boss cleave");
  }
  if (mechanics.includes("boss-aggro")) {
    order.push("Tank buster");
  }
  if (mechanics.includes("proximity")) {
    order.push("Proximity (near)");
    order.push("Proximity (far)");
  }
  if (mechanics.includes("tethers-no-intersect") || mechanics.includes("tethers-parallel")) {
    order.push("Orange tethers");
  }
  if (mechanics.includes("flare-spread")) {
    order.push("Flare spread");
  }
  if (mechanics.includes("tower-soak")) {
    order.push("Tower soak");
  }
  if (mechanics.includes("limit-cut")) {
    order.push("Limit cut");
  }
  if (mechanics.includes("add-damage")) {
    order.push("Add damage");
  }
  if (mechanics.includes("stack")) {
    order.push("Stack marker");
  }
  if (mechanics.includes("hello-world")) {
    order.push("Bug pairs");
  }
  if (mechanics.includes("healing") || mechanics.includes("rescue")) {
    order.push("Healing and rescue");
  }
  order.push("Return to clock spots");
  order.push("All other clues are checked.");
  return order;
}

function buildCluePool(
  rng: ReturnType<typeof createRng>,
  puzzle: Omit<Puzzle, "clues" | "starting" | "solutionCount">,
): Clue[] {
  const clues: Clue[] = [];
  const solution = puzzle.solution;

  for (const position of POSITIONS) {
    for (const tag of rng.shuffle(usefulTagsForJob(solution[position])).slice(0, 4)) {
      clues.push({
        id: `self-${position}-${tag}`,
        kind: "self-tag",
        position,
        tag,
        positive: true,
      });
    }

    for (const offset of rng.shuffle([-2, -1, 1, 2, 4]).slice(0, 3)) {
      const target = offsetPosition(position, offset);
      const tag = rng.pick(usefulTagsForJob(solution[target]));
      clues.push({
        id: `rel-${position}-${offset}-${tag}`,
        kind: "relative-tag",
        position,
        offset,
        tag,
        positive: true,
      });
    }

    for (const tag of [
      "tank",
      "healer",
      "dps",
      "cast-bar",
      "raid-buff",
      "ranged",
      "melee",
    ] satisfies TagId[]) {
      const neighbors = neighborPositions(position);
      const count = neighbors.filter((neighbor) => jobHasTag(solution[neighbor], tag)).length;
      if (count === 0) {
        clues.push({
          id: `neither-${position}-${tag}`,
          kind: "neighbor-tag",
          position,
          mode: "neither",
          tag,
        });
      } else if (count === 2) {
        clues.push({
          id: `both-${position}-${tag}`,
          kind: "neighbor-tag",
          position,
          mode: "both",
          tag,
        });
      } else {
        clues.push({
          id: `either-${position}-${tag}`,
          kind: "neighbor-tag",
          position,
          mode: "either",
          tag,
        });
      }
    }
  }

  for (const group of [
    "cardinal",
    "intercardinal",
    "north",
    "south",
    "east",
    "west",
  ] satisfies PositionGroup[]) {
    for (const tag of [
      "tank",
      "healer",
      "dps",
      "melee",
      "ranged",
      "cast-bar",
      "raid-buff",
    ] satisfies TagId[]) {
      const count = positionsInGroup(group).filter((position) =>
        jobHasTag(solution[position], tag),
      ).length;
      if (count > 0 && count < positionsInGroup(group).length) {
        const position = rng.pick(POSITIONS);
        clues.push({
          id: `group-${group}-${tag}-${count}`,
          kind: "group-count",
          position,
          group,
          tag,
          count,
          comparator: "exactly",
        });
      }
    }
  }

  const mechanicPositions = rng.shuffle(POSITIONS);
  for (const mechanic of MECHANIC_BY_DIFFICULTY[puzzle.difficulty]) {
    if (mechanicAvailable(mechanic, puzzle)) {
      clues.push({
        id: `mechanic-${mechanic}`,
        kind: "mechanic",
        position: mechanicPositions.pop() ?? rng.pick(POSITIONS),
        mechanic,
      });
    }
  }

  const unique = new Map<string, Clue>();
  for (const clue of clues) {
    if (
      evaluateClue(clue, solution, { ...puzzle, clues: [], starting: solution, solutionCount: 1 })
    ) {
      unique.set(clueKey(clue), clue);
    }
  }
  return [...unique.values()];
}

function mechanicAvailable(
  mechanic: Extract<Clue, { kind: "mechanic" }>["mechanic"],
  puzzle: Omit<Puzzle, "clues" | "starting" | "solutionCount">,
): boolean {
  const markers = puzzle.markers;
  switch (mechanic) {
    case "boss-aggro":
      return Boolean(markers.aggroPosition);
    case "vuln-dodge":
      return markers.vulnJobs.length > 0;
    case "proximity":
      return markers.tethers.some((tether) => tether.kind === "near" || tether.kind === "far");
    case "tethers-no-intersect":
    case "tethers-parallel":
      return markers.tethers.filter((tether) => tether.kind === "orange").length >= 2;
    case "flare-spread":
      return markers.flareJobs.length > 1;
    case "healing":
    case "rescue":
      return markers.lowHpJobs.length > 0;
    case "hello-world":
      return markers.redBugJobs.length > 0;
    case "tower-soak":
      return markers.towerPositions.length > 0;
    case "limit-cut":
      return markers.limitCut.length > 1;
    case "add-damage":
      return markers.addPositions.length > 0;
    case "stack":
      return Boolean(markers.stackJob);
  }
}

function chooseClues(
  rng: ReturnType<typeof createRng>,
  puzzle: Omit<Puzzle, "clues" | "starting" | "solutionCount">,
  pool: Clue[],
  requiredMechanics: Array<Extract<Clue, { kind: "mechanic" }>["mechanic"]>,
): { clues: Clue[]; solutionCount: number } {
  const permutations = allBoards(puzzle.selectedJobs);
  const selected: Clue[] = [];
  const required = rng.shuffle(
    pool.filter((clue) => clue.kind === "mechanic" && requiredMechanics.includes(clue.mechanic)),
  );

  for (const clue of required) {
    if (
      selected.length < Math.min(required.length, mechanicCount(puzzle.difficulty)) &&
      !selected.some((item) => item.position === clue.position)
    ) {
      selected.push(clue);
    }
  }

  let solutionCount = countSolutions(puzzle, selected, permutations);
  const candidates = rng.shuffle(pool.filter((clue) => !selected.includes(clue)));

  while (selected.length < POSITIONS.length && candidates.length > 0) {
    let bestIndex = 0;
    let bestCount = Number.POSITIVE_INFINITY;

    const openPositions = new Set(
      POSITIONS.filter((position) => !selected.some((clue) => clue.position === position)),
    );
    const eligible = candidates.filter((clue) => openPositions.has(clue.position));
    if (eligible.length === 0) {
      break;
    }

    for (let index = 0; index < Math.min(eligible.length, 32); index += 1) {
      const nextClues = [...selected, eligible[index]];
      const nextCount = countSolutions(puzzle, nextClues, permutations, bestCount);
      if (nextCount < bestCount) {
        bestIndex = index;
        bestCount = nextCount;
      }
    }

    const best = eligible[bestIndex];
    candidates.splice(candidates.indexOf(best), 1);
    selected.push(best);
    solutionCount = bestCount;

    if (solutionCount <= 1 && selected.length >= POSITIONS.length) {
      break;
    }
  }

  return { clues: selected.slice(0, POSITIONS.length), solutionCount };
}

function countSolutions(
  puzzle: Omit<Puzzle, "clues" | "starting" | "solutionCount">,
  clues: Clue[],
  boards: BoardSlots[],
  stopAfter = Number.POSITIVE_INFINITY,
): number {
  let count = 0;
  const candidatePuzzle: Puzzle = {
    ...puzzle,
    clues,
    starting: puzzle.solution,
    solutionCount: 0,
  };

  for (const board of boards) {
    if (clues.every((clue) => evaluateClue(clue, board, candidatePuzzle))) {
      count += 1;
      if (count >= stopAfter) {
        return count;
      }
    }
  }

  return count;
}

function allBoards(jobs: JobId[]): BoardSlots[] {
  const boards: BoardSlots[] = [];
  const used = new Set<JobId>();
  const current: JobId[] = [];

  const visit = () => {
    if (current.length === jobs.length) {
      boards.push(boardFromJobs(current));
      return;
    }

    for (const job of jobs) {
      if (!used.has(job)) {
        used.add(job);
        current.push(job);
        visit();
        current.pop();
        used.delete(job);
      }
    }
  };

  visit();
  return boards;
}

function createStartingBoard(
  rng: ReturnType<typeof createRng>,
  jobs: JobId[],
  puzzle: Puzzle,
): BoardSlots {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const board = boardFromJobs(rng.shuffle(jobs));
    const satisfied = evaluateAllClues(puzzle, board).filter(Boolean).length;
    if (!sameBoard(board, puzzle.solution) && satisfied < puzzle.clues.length - 1) {
      return board;
    }
  }
  return boardFromJobs([...jobs].reverse());
}

function allPositionPairs(): Array<[PositionId, PositionId]> {
  const pairs: Array<[PositionId, PositionId]> = [];
  for (let a = 0; a < POSITIONS.length; a += 1) {
    for (let b = a + 1; b < POSITIONS.length; b += 1) {
      pairs.push([POSITIONS[a], POSITIONS[b]]);
    }
  }
  return pairs;
}

function tutorialPuzzle(): Puzzle {
  const selectedJobs: JobId[] = ["PLD", "WHM", "DNC", "RDM", "WAR", "BRD", "BLM", "SCH"];
  const solution = boardFromJobs(["WHM", "PLD", "RDM", "DNC", "BLM", "BRD", "WAR", "SCH"]);
  const starting = boardFromJobs(["SCH", "BLM", "WAR", "BRD", "WHM", "PLD", "RDM", "DNC"]);
  const markers: PuzzleMarkers = {
    aggroPosition: "SW",
    vulnJobs: ["WAR"],
    flareJobs: [],
    lowHpJobs: ["DNC"],
    redBugJobs: [],
    blueBugJobs: [],
    towerPositions: ["NE"],
    stackJob: "DNC",
    tethers: [{ a: "PLD", b: "SCH", kind: "near" }],
    limitCut: [],
    addPositions: [],
  };
  const clues: Clue[] = [
    { id: "tutorial-1", kind: "self-tag", position: "N", tag: "healer", positive: true },
    { id: "tutorial-2", kind: "self-tag", position: "NE", tag: "shield", positive: true },
    { id: "tutorial-3", kind: "self-tag", position: "E", tag: "backstep", positive: true },
    { id: "tutorial-4", kind: "self-tag", position: "SE", tag: "physical-ranged", positive: true },
    { id: "tutorial-5", kind: "self-tag", position: "S", tag: "fire-action", positive: true },
    {
      id: "tutorial-6",
      kind: "relative-tag",
      position: "SW",
      offset: -1,
      tag: "raid-buff",
      positive: true,
    },
    { id: "tutorial-7", kind: "neighbor-tag", position: "W", mode: "neither", tag: "healer" },
    { id: "tutorial-8", kind: "mechanic", position: "NW", mechanic: "proximity" },
  ];

  return {
    id: "tutorial",
    dateKey: "tutorial",
    dateLabel: "Tutorial",
    difficulty: "normal",
    solution,
    starting,
    selectedJobs,
    clues,
    markers,
    order: ["Proximity (near)", "Proximity (far)", "All other clues are checked."],
    cleaveHits: [],
    rescueOffset: 4,
    solutionCount: 1,
  };
}
