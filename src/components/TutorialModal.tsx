import { ChevronLeft, ChevronRight, X } from "lucide-react";

const STEPS = [
  "Read each clue as a constraint for the clock position beside it.",
  "Move jobs around the clock by dragging a token, or select one token and then another to swap them.",
  "The number in the middle updates as clues become satisfied.",
  "Role colors help scanning: blue tanks, green healers, and red DPS.",
  "Mechanic markers can move with jobs. Fixed tower, add, and aggro markers stay on their clock spots.",
  "Easy Mode shows which individual clues are currently true.",
  "Blind Prog hides clue text until you inspect a position.",
  "When all clues are satisfied, your local time and swap count are saved in this browser.",
];

interface TutorialModalProps {
  open: boolean;
  step: number;
  onStep(step: number): void;
  onClose(): void;
}

export function TutorialModal({ open, step, onStep, onClose }: TutorialModalProps) {
  if (!open) {
    return null;
  }

  const current = Math.max(0, Math.min(step, STEPS.length - 1));

  return (
    <div className="tutorial-popover" role="dialog" aria-modal="true" aria-label="Tutorial">
      <button
        className="icon-button close"
        type="button"
        onClick={onClose}
        aria-label="Close tutorial"
      >
        <X size={16} />
      </button>
      <p>{STEPS[current]}</p>
      <div className="tutorial-footer">
        <span>
          {current + 1} / {STEPS.length}
        </span>
        <div>
          <button type="button" disabled={current === 0} onClick={() => onStep(current - 1)}>
            <ChevronLeft size={16} />
            Back
          </button>
          <button
            type="button"
            onClick={current === STEPS.length - 1 ? onClose : () => onStep(current + 1)}
          >
            {current === STEPS.length - 1 ? "Finish" : "Next"}
            {current === STEPS.length - 1 ? null : <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
