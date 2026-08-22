import { useSession } from "../../context/SessionContext.js";
import { AgentActivityFeed } from "./AgentActivityFeed.js";
import { ChatInput } from "./ChatInput.js";
import { MessageList } from "./MessageList.js";

export function ChatPane() {
  const { state, sendMessage } = useSession();

  return (
    <div className="chat-pane">
      <div className="chat-pane-scroll">
        <MessageList messages={state.messages} />
        <AgentActivityFeed activity={state.activity} />
        {state.error ? <p className="chat-error">{state.error}</p> : null}
      </div>
      <ChatInput disabled={state.status === "processing"} onSend={sendMessage} />
    </div>
  );
}
