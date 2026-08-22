import { useEffect, useRef } from "react";
import { useSession } from "../../context/SessionContext.js";
import { EmulatorControls } from "./EmulatorControls.js";

const EMULATOR_URL = `https://vc64web.github.io/#${encodeURIComponent(JSON.stringify({ openROMS: true }))}`;

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function EmulatorPane() {
  const { state } = useSession();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!state.lastPrgBase64) return;
    const iframeWindow = iframeRef.current?.contentWindow;
    if (!iframeWindow) return;

    const file = base64ToUint8Array(state.lastPrgBase64);
    iframeWindow.postMessage({ cmd: "load", file_name: "game.prg", file }, "*");
    iframeWindow.postMessage({ cmd: "script", script: "wasm_reset(); reset_keyboard();" }, "*");
  }, [state.lastPrgBase64]);

  function handleReset() {
    iframeRef.current?.contentWindow?.postMessage({ cmd: "script", script: "wasm_reset();" }, "*");
  }

  return (
    <div className="emulator-pane">
      <EmulatorControls onReset={handleReset} />
      <iframe ref={iframeRef} className="emulator-frame" title="C64 emulator" src={EMULATOR_URL} allow="autoplay" />
    </div>
  );
}
