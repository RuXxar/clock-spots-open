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
  if (lower.includes("healing") || lower.includes("rescue")) {
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
