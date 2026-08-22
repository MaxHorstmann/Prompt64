import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import type { ReactNode } from "react";

interface SplitLayoutProps {
  chat: ReactNode;
  emulator: ReactNode;
  source?: ReactNode;
}

export function SplitLayout({ chat, emulator, source }: SplitLayoutProps) {
  return (
    <PanelGroup direction="horizontal" className="split-layout">
      <Panel defaultSize={35} minSize={25} className="split-panel">
        {chat}
      </Panel>
      <PanelResizeHandle className="split-resize-handle" />
      <Panel minSize={30} className="split-panel">
        {emulator}
      </Panel>
      {source ? (
        <>
          <PanelResizeHandle className="split-resize-handle" />
          <Panel defaultSize={30} minSize={20} className="split-panel">
            {source}
          </Panel>
        </>
      ) : null}
    </PanelGroup>
  );
}
