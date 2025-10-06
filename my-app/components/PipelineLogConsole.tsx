import React, { useEffect, useRef, useState } from "react";

export default function PipelineLogConsole() {
  const [logs, setLogs] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/pipeline-logs");
    ws.onmessage = (event) => setLogs((prev) => [...prev, event.data]);
    ws.onerror = (e) => setLogs((prev) => [...prev, "[error] WebSocket error"]);
    ws.onclose = () => setLogs((prev) => [...prev, "[pipeline] Connection closed"]);
    return () => ws.close();
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div
      ref={logRef}
      style={{
        height: 200,
        background: "#111",
        color: "#0f0",
        fontFamily: "monospace",
        overflowY: "auto",
        padding: 12,
        borderRadius: 8,
        margin: "16px 0",
      }}
    >
      {logs.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  );
}