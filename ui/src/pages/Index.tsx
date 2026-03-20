import { useState, useRef, useCallback, useEffect } from "react";
// import DownloadButton from "../components/ui/download_button";
import DownloadButton  from "../components/ui/DownloadButton";
import {InfoTooltip} from "../components/ui/infobutton"


type ConnectionStatus = "idle" | "connecting" | "connected" | "done" | "error";

interface FileData {
  path: string;
  content: string;
}

interface LogEntry {
  timestamp: string;
  tag: "status" | "file" | "done" | "error" | "info";
  message: string;
}

const EXT_COLORS: Record<string, string> = {
  tsx: "var(--cyan)",
  ts: "var(--blue)",
  js: "var(--amber)",
  css: "var(--purple)",
  json: "var(--orange)",
};

function getExt(path: string) {
  return path.split(".").pop() || "";
}

function getTimestamp() {
  return new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function groupFilesByFolder(files: FileData[]) {
  const groups: Record<string, FileData[]> = {};
  files.forEach((f) => {
    const parts = f.path.split("/");
    const folder = parts.length > 1 ? parts.slice(0, -1).join("/") : "/";
    if (!groups[folder]) groups[folder] = [];
    groups[folder].push(f);
  });
  return groups;
}

const TAG_COLORS: Record<string, string> = {
  status: "var(--blue)",
  file: "var(--green)",
  done: "var(--green)",
  error: "var(--red)",
  info: "var(--text3)",
};

export default function Index() {
  const [prompt, setPrompt] = useState("");
  const [wsUrl, setWsUrl] = useState("wss://frontend-gen-agent.onrender.com/ws");
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [files, setFiles] = useState<FileData[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const isFirstFileRef = useRef(true);
  const fileCountRef = useRef(0);
  const [apiKey, setApiKey] = useState("")
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const addLog = useCallback((tag: LogEntry["tag"], message: string) => {
    setLogs((prev) => [...prev, { timestamp: getTimestamp(), tag, message }]);
  }, []);

  const resetState = useCallback(() => {
    setFiles([]);
    setActiveFile(null);
    setOpenTabs([]);
    setLogs([]);
    isFirstFileRef.current = true;
    fileCountRef.current = 0;
  }, []);

  const stopRun = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus("idle");
  }, []);

  const startRun = useCallback(() => {
    if (!prompt.trim()){
      alert("Please enter a prompt to proceed.");
      addLog("error", "Prompt is required");
      return;
    }
    if (!apiKey.trim()){
      alert("Please enter your API key to proceed.");
      addLog("error", "API key is required");
      return;
    }
    resetState();
    setStatus("connecting");
    addLog("status", "Connecting to " + wsUrl);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("connected");
      addLog("status", "Connected. Sending prompt...");
      ws.send(JSON.stringify({ prompt, api_key: apiKey }));  // ← add api_key here
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "status") {
          addLog("status", data.message);
        } else if (data.type === "file_update") {
          fileCountRef.current++;
          setFiles((prev) => {
            const exists = prev.find((f) => f.path === data.path);
            if (exists) return prev.map((f) => (f.path === data.path ? { ...f, content: data.content } : f));
            return [...prev, { path: data.path, content: data.content }];
          });
          setOpenTabs((prev) => (prev.includes(data.path) ? prev : [...prev, data.path]));
          if (isFirstFileRef.current) {
            setActiveFile(data.path);
            isFirstFileRef.current = false;
          }
          addLog("file", `Updated: ${data.path}`);
        } else if (data.type === "done") {
          addLog("done", `Pipeline complete. ${fileCountRef.current} file(s) generated.`);
          setStatus("done");
          ws.close();
          wsRef.current = null;
        }
      } catch {
        addLog("error", "Failed to parse message");
      }
    };

    ws.onerror = () => {
      addLog("error", "WebSocket error");
      setStatus("error");
      wsRef.current = null;
    };

    ws.onclose = () => {
      if (wsRef.current === ws) {
        addLog("error", "Connection dropped");
        setStatus("idle");
        wsRef.current = null;
      }
    };
  }, [prompt, wsUrl, apiKey, resetState, addLog]);

  const isRunning = status === "connecting" || status === "connected";

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!isRunning) startRun();
    }
  };

  const openFile = (path: string) => {
    setActiveFile(path);
    if (!openTabs.includes(path)) setOpenTabs((prev) => [...prev, path]);
  };

  const activeContent = files.find((f) => f.path === activeFile)?.content || "";
  const grouped = groupFilesByFolder(files);

  const statusBadgeColor = {
    idle: "var(--text3)",
    connecting: "var(--amber)",
    connected: "var(--green)",
    done: "var(--green)",
    error: "var(--red)",
  }[status];

  return (
    <div className="font-mono" style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      {/* Titlebar */}
      <div className="flex gap-4" style={{ height: 38, background: "var(--bg2)", borderBottom: "1px solid var(--border-main)", display: "flex", alignItems: "center", padding: "0 12px", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e" }} />
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
        </div>
        <span style={{ marginLeft: 16, color: "var(--text2)", fontSize: 13 }}>idelyze / ai-agent-frontend</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, background: "var(--bg4)", borderRadius: 9999, padding: "2px 10px 2px 8px", fontSize: 11, color: statusBadgeColor }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusBadgeColor, boxShadow: `0 0 6px ${statusBadgeColor}` }} />
          {status}
        </div>
        <DownloadButton files={files} />
      </div>

      {/* API Key bar */}
      <div style={{ background: "var(--bg3)", borderBottom: "1px solid var(--border-main)", display: "flex", alignItems: "center", padding: "5px 12px", gap: 8, flexShrink: 0 }}>
        <InfoTooltip text="The API key is used to authenticate your requests. It is only stored in memory and will not be saved or transmitted to any server. You can generate a key from your GROQ dashboard." />
        <span style={{ fontSize: 11, color: "var(--text2)", fontFamily: "'IBM Plex Mono', monospace", whiteSpace: "nowrap" }}>
          GROQ_API_KEY
        </span>
        <input
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          type={showKey ? "text" : "password"}
          placeholder="gsk_••••••••••••••••••••••••"
          style={{ flex: 1, background: "var(--bg4)", border: "1px solid var(--border-main)", color: "var(--text)", padding: "5px 10px", fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", outline: "none", borderRadius: 2 }}
        />
        <button
          type="button"
          onClick={() => setShowKey((v) => !v)}
          style={{ background: "none", border: "1px solid var(--border-main)", color: "var(--text2)", padding: "4px 8px", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", cursor: "pointer", borderRadius: 2 }}
        >
          {showKey ? "hide" : "show"}
        </button>
        <span style={{ fontSize: 10, color: "var(--text2)", fontFamily: "'IBM Plex Mono', monospace", opacity: 0.6, whiteSpace: "nowrap" }}>
          🔒 not stored
        </span>
      </div>

      {/* Prompt bar */}
      <div style={{ background: "var(--bg3)", borderBottom: "1px solid var(--border-main)", display: "flex", alignItems: "center", padding: "6px 12px", gap: 8, flexShrink: 0 }}>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter your prompt..."
          style={{ flex: 1, background: "var(--bg4)", border: "1px solid var(--border-main)", color: "var(--text)", padding: "6px 10px", fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", outline: "none", borderRadius: 2 }}
        />
        <input
          value={wsUrl}
          onChange={(e) => setWsUrl(e.target.value)}
          style={{ width: 220, background: "var(--bg4)", border: "1px solid var(--border-main)", color: "var(--text2)", padding: "6px 10px", fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", outline: "none", borderRadius: 2 }}
        />
        <button
          type="button"
          onClick={isRunning ? stopRun : startRun}
          style={{
            padding: "6px 16px",
            fontSize: 13,
            fontFamily: "'IBM Plex Mono', monospace",
            fontWeight: 500,
            borderRadius: 2,
            border: "none",
            cursor: "pointer",
            background: isRunning ? "var(--red)" : status === "done" ? "var(--green)" : "#fff",
            color: isRunning ? "#fff" : status === "done" ? "#000" : "#000",
          }}
        >
          {isRunning ? "◼ Stop" : status === "done" ? "▶ Run" : "Run"}
        </button>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", minHeight: 0, scrollbarWidth: "none" }} className="[&::-webkit-scrollbar]:hidden">
        {/* Sidebar */}
        <div style={{ width: 195, flexShrink: 0, background: "var(--bg2)", borderRight: "1px solid var(--border-main)", overflowY: "auto", padding: "8px 0" }}>
          <div style={{ padding: "4px 12px", fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 1 }}>Explorer</div>
          {Object.entries(grouped).map(([folder, folderFiles]) => (
            <div key={folder}>
              <div style={{ padding: "4px 12px", fontSize: 12, color: "var(--text2)", marginTop: 4 }}>📁 {folder}</div>
              {folderFiles.map((f) => {
                const ext = getExt(f.path);
                const isActive = f.path === activeFile;
                return (
                  <div
                    key={f.path}
                    onClick={() => openFile(f.path)}
                    style={{
                      padding: "3px 12px 3px 20px",
                      fontSize: 12,
                      color: isActive ? "var(--text)" : "var(--text2)",
                      cursor: "pointer",
                      borderLeft: isActive ? "2px solid var(--green)" : "2px solid transparent",
                      background: isActive ? "var(--bg4)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: EXT_COLORS[ext] || "var(--text3)", flexShrink: 0 }} />
                    {f.path.split("/").pop()}
                  </div>
                );
              })}
            </div>
          ))}
          {files.length === 0 && <div style={{ padding: "12px", fontSize: 12, color: "var(--text3)" }}>No files yet</div>}
        </div>

        {/* Editor */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 , scrollbarWidth: "none" }}
        className="[&::-webkit-scrollbar]:hidden" 
        >
          {/* Tabs */}
          <div style={{ display: "flex", background: "var(--bg3)", borderBottom: "1px solid var(--border-main)", flexShrink: 0, overflowX: "auto" }}>
            {openTabs.map((tab) => {
              const isActive = tab === activeFile;
              return (
                <div
                  key={tab}
                  onClick={() => setActiveFile(tab)}
                  style={{
                    padding: "6px 14px",
                    fontSize: 12,
                    color: isActive ? "var(--text)" : "var(--text2)",
                    cursor: "pointer",
                    borderBottom: isActive ? "2px solid var(--green)" : "2px solid transparent",
                    background: isActive ? "var(--bg4)" : "transparent",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tab.split("/").pop()}
                </div>
              );
            })}
          </div>
          {/* Code */}
          <div style={{ flex: 1, overflow: "auto", padding: 16, background: "var(--bg)" }}>
            {activeFile ? (
              <pre style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "#9da5b4", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{activeContent}</pre>
            ) : (
              <div style={{ color: "var(--text3)", fontSize: 13, paddingTop: 40, textAlign: "center" }}>No file open</div>
            )}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div
        ref={logRef}
        style={{ height: 130, flexShrink: 0, background: "var(--bg3)", borderTop: "1px solid var(--border-main)", overflowY: "auto", padding: "6px 12px", fontSize: 12, scrollbarWidth: "none" }}
        className="[&::-webkit-scrollbar]:hidden"
      >
        {logs.map((log, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, lineHeight: "22px" }}>
            <span style={{ color: "var(--text3)", flexShrink: 0 }}>{log.timestamp}</span>
            <span
              style={{
                background: TAG_COLORS[log.tag],
                color: log.tag === "info" ? "var(--text2)" : "#000",
                padding: "0 10px",
                borderRadius: 9999,
                fontSize: 10,
                fontWeight: 500,
                flexShrink: 0,
              }}
              className="h-[1.1rem] flex justify-center items-center"
            >
              {log.tag}
            </span>
            <span style={{ color: "var(--text)" }}>{log.message}</span>
          </div>
        ))}
        {logs.length === 0 && <div style={{ color: "var(--text3)" }}>Waiting for activity...</div>}
      </div>
    </div>
  );
}
