export const POSITIONS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;

export type PositionId = (typeof POSITIONS)[number];

export type Role = "tank" | "healer" | "dps";
export type DamageRole = "melee" | "physical-ranged" | "caster";

export type JobId =
  | "PLD"
  | "WAR"
  | "DRK"
  | "GNB"
  | "WHM"
  | "SCH"
  | "AST"
  | "SGE"
  | "MNK"
  | "DRG"
  | "NIN"
  | "SAM"
  | "RPR"
  | "VPR"
  | "BRD"
  | "MCH"
  | "DNC"
  | "BLM"
  | "SMN"
  | "RDM"
  | "PCT";

export type TagId =
  | Role
  | DamageRole
  | "support"
  | "ranged"
  | "magic"
  | "shield"
  | "sword"
  | "gun"
  | "book"
  | "dual-wield"
  | "cast-bar"
  | "raid-buff"
  | "backstep"
  | "auto-crit"
  | "fire-action"
  | "dawntrail"
  | "barrier-healer"
  | "regen-healer"
  | "aiming-accessories"
  | "gridania"
  | "limsa"
  | "uldah"
  | "ishgard";

export type DifficultyId = "normal" | "extreme" | "savage" | "ultimate";

export type PositionGroup =
  | "all"
  | "cardinal"
  | "intercardinal"
  | "north"
  | "south"
  | "east"
  | "west";

export type KnockbackDirection = "north" | "south" | "east" | "west";

export interface JobDefinition {
  id: JobId;
  name: string;
  role: Role;
  damageRole?: DamageRole;
  color: "blue" | "green" | "red";
  tags: TagId[];
}

export type BoardSlots = Record<PositionId, JobId>;

export interface TetherMarker {
  a: JobId;
  b: JobId;
  kind: "near" | "far" | "orange";
}

export interface LimitCutMarker {
  job: JobId;
  order: number;
}

export interface PuzzleMarkers {
  aggroPosition?: PositionId;
  vulnJobs: JobId[];
  flareJobs: JobId[];
  lowHpJobs: JobId[];
  redBugJobs: JobId[];
  blueBugJobs: JobId[];
  towerPositions: PositionId[];
  stackJob?: JobId;
  tethers: TetherMarker[];
  limitCut: LimitCutMarker[];
  addPositions: PositionId[];
}

export type Clue =
  | {
      id: string;
      kind: "self-tag";
      position: PositionId;
      tag: TagId;
      positive: boolean;
    }
  | {
      id: string;
      kind: "relative-tag";
      position: PositionId;
      offset: number;
      tag: TagId;
      positive: boolean;
    }
  | {
      id: string;
      kind: "neighbor-tag";
      position: PositionId;
      mode: "both" | "neither" | "either";
      tag: TagId;
    }
  | {
      id: string;
      kind: "group-count";
      position: PositionId;
      group: PositionGroup;
      tag: TagId;
      count: number;
      comparator: "exactly" | "at-least" | "at-most";
    }
  | {
      id: string;
      kind: "mechanic";
      position: PositionId;
      mechanic:
        | "boss-aggro"
        | "vuln-dodge"
        | "proximity"
        | "tethers-no-intersect"
        | "tethers-parallel"
        | "flare-spread"
        | "healing"
        | "hello-world"
        | "tower-soak"
        | "limit-cut"
        | "rescue"
        | "add-damage"
        | "stack";
    };

export interface Puzzle {
  id: string;
  dateKey: string;
  dateLabel: string;
  difficulty: DifficultyId;
  solution: BoardSlots;
  starting: BoardSlots;
  selectedJobs: JobId[];
  clues: Clue[];
  markers: PuzzleMarkers;
  order: string[];
  knockback?: KnockbackDirection;
  cleaveHits: PositionId[];
  rescueOffset: number;
  solutionCount: number;
}

export interface SolveRecord {
  id: string;
  dateKey: string;
  dateLabel: string;
  difficulty: DifficultyId;
  solved: boolean;
  elapsedSeconds: number;
  swaps: number;
  easyMode: boolean;
  blindProg: boolean;
  solvedAt: string;
}
