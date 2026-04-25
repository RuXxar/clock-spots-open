import { Clipboard, RotateCcw, Share2, X } from "lucide-react";
import { formatTime } from "./Header";
import type { DifficultyId } from "../game/types";

interface ShareDialogProps {
  open: boolean;
  dateLabel: string;
  difficulty: DifficultyId;
  elapsed: number;
  swaps: number;
  easyMode: boolean;
  blindProg: boolean;
  copied: boolean;
  onCopy(): void;
  onClose(): void;
  onPlayAgain(): void;
}

export function ShareDialog({
  open,
  dateLabel,
  difficulty,
  elapsed,
  swaps,
  easyMode,
  blindProg,
  copied,
  onCopy,
  onClose,
  onPlayAgain,
}: ShareDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="share-title">
        <button className="icon-button close" type="button" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
        <h2 id="share-title">
          <Share2 size={18} />
          Ready to Pull
        </h2>
        <div className="result-grid">
          <span>{dateLabel}</span>
          <strong>{difficulty}</strong>
          <span>{formatTime(elapsed)}</span>
          <strong>{swaps} swaps</strong>
        </div>
        <p className="muted">
          {easyMode ? "Easy Mode" : "Classic"} {blindProg ? "with Blind Prog" : ""}
        </p>
        <button className="primary" type="button" onClick={onCopy}>
          <Clipboard size={17} />
          {copied ? "Copied" : "Copy Result"}
        </button>
        <button type="button" onClick={onPlayAgain}>
          <RotateCcw size={17} />
          Play Again
        </button>
      </div>
    </div>
  );
}
