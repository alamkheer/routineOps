import type { SystemLog } from "../types";

interface TerminalOverlayProps {
  logs: SystemLog[];
}

export function TerminalOverlay({ logs }: TerminalOverlayProps) {
  return (
    <div className="hidden md:block absolute bottom-0 left-0 w-full h-40 bg-slate-900/90 backdrop-blur-md border-t border-border-subtle p-4 font-mono text-xs overflow-y-auto z-40">
      <div className="flex gap-2">
        <span className="text-cyan-system">{">"}</span>
        <span className="text-cyan-system uppercase">
          Awaiting_Input
          <span className="terminal-cursor" />
        </span>
      </div>
      {logs.map((log) => {
        let colorClass = "text-cyan-system";
        let prefix = ">";

        if (log.type === "ERROR") {
          colorClass = "text-red-critical";
          prefix = "!!";
        } else if (log.type === "WARN" || log.type === "ESCALATION") {
          colorClass = "text-amber-warning";
          prefix = ">>";
        } else if (log.type === "SUCCESS") {
          colorClass = "text-green-nominal";
          prefix = "[OK]";
        }

        return (
          <div key={log.id} className="flex gap-4 mb-1">
            <span className="text-on-surface-muted">
              [{new Date(log.timestamp).toLocaleTimeString()}]
            </span>
            <span className={colorClass}>
              {prefix} {log.message}
            </span>
          </div>
        );
      })}
    </div>
  );
}
