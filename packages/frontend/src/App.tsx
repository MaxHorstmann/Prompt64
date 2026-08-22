import { useState } from "react";
import { ChatPane } from "./components/ChatPane/ChatPane.js";
import { EmulatorPane } from "./components/EmulatorPane/EmulatorPane.js";
import { SplitLayout } from "./components/Layout/SplitLayout.js";
import { SourceViewer } from "./components/SourceViewer/SourceViewer.js";
import { SessionProvider, useSession } from "./context/SessionContext.js";

function ConnectionBanner() {
  const { state } = useSession();
  if (state.wsStatus === "connected") return null;
  return (
    <div className="connection-banner">
      {state.wsStatus === "connecting" ? "Connecting…" : "Disconnected — reconnecting…"}
    </div>
  );
}

function AppShell() {
  const [showSource, setShowSource] = useState(false);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Prompt64</h1>
        <label className="source-toggle">
          <input
            type="checkbox"
            checked={showSource}
            onChange={(event) => setShowSource(event.target.checked)}
          />
          Show source
        </label>
      </header>
      <ConnectionBanner />
      <main className="app-main">
        <SplitLayout
          chat={<ChatPane />}
          emulator={<EmulatorPane />}
          source={showSource ? <SourceViewer /> : undefined}
        />
      </main>
    </div>
  );
}

export function App() {
  return (
    <SessionProvider>
      <AppShell />
    </SessionProvider>
  );
}
