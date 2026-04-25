import { Home } from "lucide-react";

export function Privacy({ onNavigate }: { onNavigate(path: string): void }) {
  return (
    <main className="page-view prose">
      <div className="page-header">
        <button type="button" onClick={() => onNavigate("/")}>
          <Home size={16} />
          Back
        </button>
        <h1>Privacy Policy</h1>
      </div>
      <p>
        Clock Spots Open is a static, fan-made puzzle app. It does not include analytics or a remote
        backend.
      </p>
      <p>
        Puzzle progress, settings, local poll choices, and solve history are saved in this browser
        using local storage. That data stays on this device unless you export a backup code from the
        stats page.
      </p>
      <p>No data is sold, traded, or shared by this app.</p>
    </main>
  );
}
