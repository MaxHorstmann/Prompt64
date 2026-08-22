interface EmulatorControlsProps {
  onReset: () => void;
}

export function EmulatorControls({ onReset }: EmulatorControlsProps) {
  return (
    <div className="emulator-controls">
      <button type="button" onClick={onReset}>
        Reset
      </button>
    </div>
  );
}
