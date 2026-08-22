import { useSession } from "../../context/SessionContext.js";

export function SourceViewer() {
  const { state } = useSession();

  return (
    <div className="source-viewer">
      <h2>Source</h2>
      <pre>
        <code>{state.currentSource || "; no source yet"}</code>
      </pre>
    </div>
  );
}
