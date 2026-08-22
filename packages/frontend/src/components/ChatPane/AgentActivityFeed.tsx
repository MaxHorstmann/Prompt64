import { useState } from "react";
import type { ActivityItem } from "../../context/sessionReducer.js";

export function AgentActivityFeed({ activity }: { activity: ActivityItem[] }) {
  const [open, setOpen] = useState(false);

  if (activity.length === 0) return null;

  return (
    <details className="activity-feed" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>Agent activity ({activity.length})</summary>
      <ul>
        {activity.map((item) => (
          <li key={item.id} className={`activity-item activity-${item.kind}`}>
            {renderActivityItem(item)}
          </li>
        ))}
      </ul>
    </details>
  );
}

function renderActivityItem(item: ActivityItem): string {
  switch (item.kind) {
    case "agent_thinking":
      return `thinking: ${item.text}`;
    case "tool_call":
      return `→ ${item.toolName}(${JSON.stringify(item.input)})`;
    case "tool_result":
      return `${item.isError ? "✗" : "✓"} ${item.toolName}: ${item.output}`;
    case "compilation_result":
      return item.success
        ? `compile succeeded${item.warnings ? ` (warnings: ${item.warnings})` : ""}`
        : `compile failed: ${item.errors ?? "unknown error"}`;
  }
}
