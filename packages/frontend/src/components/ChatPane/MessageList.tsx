import type { ChatMessage } from "@prompt64/shared";

export function MessageList({ messages }: { messages: ChatMessage[] }) {
  if (messages.length === 0) {
    return <p className="empty-hint">Describe the game you want to build to get started.</p>;
  }

  return (
    <ul className="message-list">
      {messages.map((message, index) => (
        <li key={index} className={`message message-${message.role}`}>
          <span className="message-role">{message.role === "user" ? "You" : "Claude"}</span>
          <p>{message.text}</p>
        </li>
      ))}
    </ul>
  );
}
