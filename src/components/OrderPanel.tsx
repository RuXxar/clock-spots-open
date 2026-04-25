import {
  Bug,
  CheckCircle2,
  ChevronsRight,
  Crosshair,
  Flame,
  HandHeart,
  HeartPulse,
  Home,
  ListChecks,
  RadioTower,
  Shield,
  Sparkles,
  Swords,
  Users,
  Wind,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { operationDescription, operationKind } from "../game/operations";

interface OrderPanelProps {
  order: string[];
  activeOperation?: string;
  operationDetail?(operation: string): string | undefined;
  onActiveOperationChange(operation?: string): void;
}

export function OrderPanel({
  order,
  activeOperation,
  operationDetail,
  onActiveOperationChange,
}: OrderPanelProps) {
  return (
    <aside className="order-panel">
      <h2>
        <ListChecks size={16} />
        Order of Operations
      </h2>
      <ol
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") {
            onActiveOperationChange(undefined);
          }
        }}
      >
        {order.map((item) => {
          const Icon = iconForOperation(item);
          const description = operationDescription(item);
          const detail = operationDetail?.(item);
          const active = activeOperation === item;
          return (
            <li key={item}>
              <button
                className={active ? "active" : ""}
                type="button"
                aria-pressed={active}
                onFocus={() => onActiveOperationChange(item)}
                onPointerEnter={() => onActiveOperationChange(item)}
                onClick={() => onActiveOperationChange(item)}
              >
                <Icon size={15} />
                <span className="operation-copy">
                  <span className="operation-label">{item}</span>
                  {description ? (
                    <span className="operation-description">{description}</span>
                  ) : null}
                  {detail ? <span className="operation-detail">{detail}</span> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

function iconForOperation(label: string): LucideIcon {
  switch (operationKind(label)) {
    case "knockback":
      return Wind;
    case "boss-cleave":
      return Swords;
    case "tank-buster":
      return Shield;
    case "proximity-near":
    case "proximity-far":
      return Users;
    case "orange-tethers":
      return ChevronsRight;
    case "flare-spread":
      return Sparkles;
    case "tower-soak":
      return RadioTower;
    case "limit-cut":
      return Crosshair;
    case "add-damage":
      return Flame;
    case "stack":
      return Users;
    case "hello-world":
      return Bug;
    case "healing":
      return HeartPulse;
    case "rescue":
      return HandHeart;
    case "return":
      return Home;
    case "check-clues":
      return CheckCircle2;
    case "unknown":
      return CheckCircle2;
  }
}
