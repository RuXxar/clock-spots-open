export type OperationKind =
  | "knockback"
  | "boss-cleave"
  | "tank-buster"
  | "proximity-near"
  | "proximity-far"
  | "orange-tethers"
  | "flare-spread"
  | "tower-soak"
  | "limit-cut"
  | "add-damage"
  | "stack"
  | "hello-world"
  | "healing"
  | "rescue"
  | "return"
  | "check-clues"
  | "unknown";

export function operationKind(label?: string): OperationKind {
  const lower = label?.toLowerCase() ?? "";

  if (lower.includes("knockback")) {
    return "knockback";
  }
  if (lower.includes("boss cleave")) {
    return "boss-cleave";
  }
  if (lower.includes("tank buster")) {
    return "tank-buster";
  }
  if (lower.includes("proximity") && lower.includes("near")) {
    return "proximity-near";
  }
  if (lower.includes("proximity") && lower.includes("far")) {
    return "proximity-far";
  }
  if (lower.includes("proximity")) {
    return "proximity-near";
  }
  if (lower.includes("orange tether")) {
    return "orange-tethers";
  }
  if (lower.includes("flare")) {
    return "flare-spread";
  }
  if (lower.includes("tower")) {
    return "tower-soak";
  }
  if (lower.includes("limit cut")) {
    return "limit-cut";
  }
  if (lower.includes("add")) {
    return "add-damage";
  }
  if (lower.includes("stack")) {
    return "stack";
  }
  if (lower.includes("bug")) {
    return "hello-world";
  }
  if (lower.includes("rescue")) {
    return "rescue";
  }
  if (lower.includes("healing")) {
    return "healing";
  }
  if (lower.includes("return")) {
    return "return";
  }
  if (lower.includes("all other")) {
    return "check-clues";
  }

  return "unknown";
}

export function operationDescription(label: string): string | undefined {
  switch (operationKind(label)) {
    case "knockback":
      return "Affected players are pushed before later checks happen.";
    case "boss-cleave":
      return "Marked players must end outside the highlighted cleave side.";
    case "tank-buster":
      return "The aggro marker needs to be held by a tank.";
    case "proximity-near":
      return "Near-tethered players need to be adjacent or on the same side.";
    case "proximity-far":
      return "Far-tethered players need distance between their clock spots.";
    case "orange-tethers":
      return "Orange tether pairs must satisfy their line rule before final clues.";
    case "flare-spread":
      return "Flare-marked players cannot be neighbors.";
    case "tower-soak":
      return "Tower spots must be occupied by support jobs.";
    case "limit-cut":
      return "Numbered players resolve 1 -> 2 -> 3 -> 4 clockwise, then wrap back to 1.";
    case "add-damage":
      return "Each add needs a DPS on its spot or next to it.";
    case "stack":
      return "The stack target needs a support job beside them.";
    case "hello-world":
      return "The red bug must sit between the two blue bugs.";
    case "healing":
      return "Low-HP targets need a healer next to them.";
    case "rescue":
      return "Chain markers are Rescue targets; each needs a healer directly across the arena.";
    case "return":
      return "Mechanic movement ends, then everyone is judged at clock spots.";
    case "check-clues":
      return "The remaining text clues are evaluated after mechanics resolve.";
    case "unknown":
      return undefined;
  }
}
