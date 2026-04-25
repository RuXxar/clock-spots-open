import { EyeOff, GraduationCap, Play } from "lucide-react";

interface StartDialogProps {
  dateLabel: string;
  difficultyLabel: string;
  onStart(): void;
  onBlind(): void;
  onTutorial(): void;
}

export function StartDialog({
  dateLabel,
  difficultyLabel,
  onStart,
  onBlind,
  onTutorial,
}: StartDialogProps) {
  return (
    <div className="modal-backdrop">
      <div
        className="modal-panel start-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="start-title"
      >
        <h2 id="start-title">Clock Spots Open</h2>
        <p>{dateLabel}</p>
        <p className="difficulty-text">{difficultyLabel}</p>
        <button className="primary" type="button" onClick={onStart}>
          <Play size={17} />
          Play Puzzle
        </button>
        <button type="button" onClick={onBlind}>
          <EyeOff size={17} />
          Blind Prog
        </button>
        <button type="button" onClick={onTutorial}>
          <GraduationCap size={17} />
          Play Tutorial
        </button>
      </div>
    </div>
  );
}
