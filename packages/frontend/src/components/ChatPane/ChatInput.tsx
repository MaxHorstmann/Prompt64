import { useState, type FormEvent } from "react";

interface ChatInputProps {
  disabled: boolean;
  onSend: (text: string) => void;
}

export function ChatInput({ disabled, onSend }: ChatInputProps) {
  const [text, setText] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (disabled || !text.trim()) return;
    onSend(text);
    setText("");
  }

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <input
        type="text"
        value={text}
        disabled={disabled}
        placeholder={disabled ? "Claude is working…" : "Describe a game or a change…"}
        onChange={(event) => setText(event.target.value)}
      />
      <button type="submit" disabled={disabled || !text.trim()}>
        Send
      </button>
    </form>
  );
}
