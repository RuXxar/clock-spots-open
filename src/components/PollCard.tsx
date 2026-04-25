import { X } from 'lucide-react';

interface PollCardProps {
  dismissed: boolean;
  vote?: 'yes' | 'no';
  onDismiss(): void;
  onVote(vote: 'yes' | 'no'): void;
}

export function PollCard({ dismissed, vote, onDismiss, onVote }: PollCardProps) {
  if (dismissed) {
    return null;
  }

  return (
    <aside className="poll-card" aria-label="Local rules poll">
      <button className="icon-button close" type="button" onClick={onDismiss} aria-label="Dismiss poll">
        <X size={15} />
      </button>
      <h2>Help settle this...</h2>
      <p>Should Paladin count as a dual-wield job?</p>
      <div className="poll-options">
        <label>
          <input type="radio" checked={vote === 'yes'} onChange={() => onVote('yes')} />
          Yes
        </label>
        <label>
          <input type="radio" checked={vote === 'no'} onChange={() => onVote('no')} />
          No
        </label>
      </div>
      <button type="button" onClick={onDismiss}>
        Not now
      </button>
    </aside>
  );
}
