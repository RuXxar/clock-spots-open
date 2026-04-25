import type { DamageRole, JobDefinition, JobId, Role, TagId } from "./types";

export const JOBS: Record<JobId, JobDefinition> = {
  PLD: {
    id: "PLD",
    name: "Paladin",
    role: "tank",
    color: "blue",
    tags: ["tank", "support", "shield", "sword", "raid-buff", "uldah"],
  },
  WAR: {
    id: "WAR",
    name: "Warrior",
    role: "tank",
    color: "blue",
    tags: ["tank", "support", "auto-crit", "limsa"],
  },
  DRK: {
    id: "DRK",
    name: "Dark Knight",
    role: "tank",
    color: "blue",
    tags: ["tank", "support", "sword", "cast-bar", "ishgard"],
  },
  GNB: {
    id: "GNB",
    name: "Gunbreaker",
    role: "tank",
    color: "blue",
    tags: ["tank", "support", "gun"],
  },
  WHM: {
    id: "WHM",
    name: "White Mage",
    role: "healer",
    color: "green",
    tags: ["healer", "support", "regen-healer", "cast-bar", "gridania"],
  },
  SCH: {
    id: "SCH",
    name: "Scholar",
    role: "healer",
    color: "green",
    tags: ["healer", "support", "barrier-healer", "book", "cast-bar", "raid-buff", "limsa"],
  },
  AST: {
    id: "AST",
    name: "Astrologian",
    role: "healer",
    color: "green",
    tags: ["healer", "support", "regen-healer", "cast-bar", "raid-buff", "ishgard"],
  },
  SGE: {
    id: "SGE",
    name: "Sage",
    role: "healer",
    color: "green",
    tags: ["healer", "support", "barrier-healer", "gun", "cast-bar"],
  },
  MNK: {
    id: "MNK",
    name: "Monk",
    role: "dps",
    damageRole: "melee",
    color: "red",
    tags: ["dps", "melee", "uldah"],
  },
  DRG: {
    id: "DRG",
    name: "Dragoon",
    role: "dps",
    damageRole: "melee",
    color: "red",
    tags: ["dps", "melee", "raid-buff", "gridania"],
  },
  NIN: {
    id: "NIN",
    name: "Ninja",
    role: "dps",
    damageRole: "melee",
    color: "red",
    tags: ["dps", "melee", "dual-wield", "raid-buff", "limsa"],
  },
  SAM: {
    id: "SAM",
    name: "Samurai",
    role: "dps",
    damageRole: "melee",
    color: "red",
    tags: ["dps", "melee", "sword", "backstep"],
  },
  RPR: {
    id: "RPR",
    name: "Reaper",
    role: "dps",
    damageRole: "melee",
    color: "red",
    tags: ["dps", "melee", "raid-buff"],
  },
  VPR: {
    id: "VPR",
    name: "Viper",
    role: "dps",
    damageRole: "melee",
    color: "red",
    tags: ["dps", "melee", "dual-wield", "dawntrail"],
  },
  BRD: {
    id: "BRD",
    name: "Bard",
    role: "dps",
    damageRole: "physical-ranged",
    color: "red",
    tags: ["dps", "physical-ranged", "ranged", "raid-buff", "aiming-accessories", "gridania"],
  },
  MCH: {
    id: "MCH",
    name: "Machinist",
    role: "dps",
    damageRole: "physical-ranged",
    color: "red",
    tags: ["dps", "physical-ranged", "ranged", "gun", "auto-crit", "aiming-accessories", "ishgard"],
  },
  DNC: {
    id: "DNC",
    name: "Dancer",
    role: "dps",
    damageRole: "physical-ranged",
    color: "red",
    tags: ["dps", "physical-ranged", "ranged", "dual-wield", "raid-buff", "aiming-accessories"],
  },
  BLM: {
    id: "BLM",
    name: "Black Mage",
    role: "dps",
    damageRole: "caster",
    color: "red",
    tags: ["dps", "caster", "ranged", "magic", "cast-bar", "fire-action", "uldah"],
  },
  SMN: {
    id: "SMN",
    name: "Summoner",
    role: "dps",
    damageRole: "caster",
    color: "red",
    tags: ["dps", "caster", "ranged", "magic", "book", "cast-bar", "raid-buff", "limsa"],
  },
  RDM: {
    id: "RDM",
    name: "Red Mage",
    role: "dps",
    damageRole: "caster",
    color: "red",
    tags: ["dps", "caster", "ranged", "magic", "sword", "cast-bar", "backstep", "raid-buff"],
  },
  PCT: {
    id: "PCT",
    name: "Pictomancer",
    role: "dps",
    damageRole: "caster",
    color: "red",
    tags: ["dps", "caster", "ranged", "magic", "cast-bar", "fire-action", "raid-buff", "dawntrail"],
  },
};

export const ALL_JOB_IDS = Object.keys(JOBS) as JobId[];

export const TAG_LABELS: Record<TagId, { noun: string; verbSingular: string; verbPlural: string }> =
  {
    tank: { noun: "a tank", verbSingular: "is a tank", verbPlural: "are tanks" },
    healer: { noun: "a healer", verbSingular: "is a healer", verbPlural: "are healers" },
    dps: { noun: "DPS", verbSingular: "is DPS", verbPlural: "are DPS" },
    melee: { noun: "melee", verbSingular: "is melee", verbPlural: "are melee" },
    "physical-ranged": {
      noun: "physical ranged",
      verbSingular: "is physical ranged",
      verbPlural: "are physical ranged",
    },
    caster: { noun: "a caster", verbSingular: "is a caster", verbPlural: "are casters" },
    support: { noun: "support", verbSingular: "is support", verbPlural: "are supports" },
    ranged: { noun: "ranged", verbSingular: "is ranged", verbPlural: "are ranged" },
    magic: { noun: "magical", verbSingular: "is magical", verbPlural: "are magical" },
    shield: {
      noun: "associated with shields",
      verbSingular: "uses a shield",
      verbPlural: "use shields",
    },
    sword: { noun: "a sword user", verbSingular: "uses a sword", verbPlural: "use swords" },
    gun: { noun: "a gun user", verbSingular: "uses a gun", verbPlural: "use guns" },
    book: { noun: "a book user", verbSingular: "uses a book", verbPlural: "use books" },
    "dual-wield": { noun: "dual wielding", verbSingular: "dual wields", verbPlural: "dual wield" },
    "cast-bar": {
      noun: "a cast bar job",
      verbSingular: "has a cast bar",
      verbPlural: "have cast bars",
    },
    "raid-buff": {
      noun: "a raid buffer",
      verbSingular: "gives a raid buff",
      verbPlural: "give raid buffs",
    },
    backstep: {
      noun: "a job with a backstep",
      verbSingular: "has a backstep",
      verbPlural: "have backsteps",
    },
    "auto-crit": {
      noun: "a job with an auto-crit ability",
      verbSingular: "has an auto-crit ability",
      verbPlural: "have auto-crit abilities",
    },
    "fire-action": {
      noun: "a job with 'Fire' in an action name",
      verbSingular: "has an action with 'Fire' in the name",
      verbPlural: "have actions with 'Fire' in the name",
    },
    dawntrail: {
      noun: "a Dawntrail job",
      verbSingular: "was released in Dawntrail",
      verbPlural: "were released in Dawntrail",
    },
    "barrier-healer": {
      noun: "a barrier healer",
      verbSingular: "is a barrier healer",
      verbPlural: "are barrier healers",
    },
    "regen-healer": {
      noun: "a regen healer",
      verbSingular: "is a regen healer",
      verbPlural: "are regen healers",
    },
    "aiming-accessories": {
      noun: "an Aiming accessory wearer",
      verbSingular: "wears Aiming accessories",
      verbPlural: "wear Aiming accessories",
    },
    gridania: {
      noun: "from Gridania",
      verbSingular: "started in Gridania",
      verbPlural: "started in Gridania",
    },
    limsa: {
      noun: "from Limsa Lominsa",
      verbSingular: "started in Limsa Lominsa",
      verbPlural: "started in Limsa Lominsa",
    },
    uldah: {
      noun: "from Ul'dah",
      verbSingular: "started in Ul'dah",
      verbPlural: "started in Ul'dah",
    },
    ishgard: {
      noun: "from Ishgard",
      verbSingular: "started in Ishgard",
      verbPlural: "started in Ishgard",
    },
  };

export function jobHasTag(jobId: JobId, tag: TagId): boolean {
  return JOBS[jobId].tags.includes(tag);
}

export function jobsByRole(role: Role): JobId[] {
  return Object.values(JOBS)
    .filter((job) => job.role === role)
    .map((job) => job.id);
}

export function jobsByDamageRole(damageRole: DamageRole): JobId[] {
  return Object.values(JOBS)
    .filter((job) => job.damageRole === damageRole)
    .map((job) => job.id);
}

export function usefulTagsForJob(jobId: JobId): TagId[] {
  const tags = JOBS[jobId].tags.filter(
    (tag) => !["support", "dps"].includes(tag) || JOBS[jobId].role !== "dps",
  );
  return tags.length > 0 ? tags : JOBS[jobId].tags;
}
