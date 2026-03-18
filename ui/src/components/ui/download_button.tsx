import JSZip from "jszip";
import { useCallback } from "react";

interface FileData {
  path: string;
  content: string;
}

interface DownloadButtonProps {
  files: FileData[];
}

export default function DownloadButton({ files }: DownloadButtonProps) {
  const downloadFiles = useCallback(async () => {
    if (files.length === 0) return;
    const zip = new JSZip();
    files.forEach((f) => zip.file(f.path, f.content));
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "generated-site.zip";
    a.click();
    URL.revokeObjectURL(url);
  }, [files]);

  const isEmpty = files.length === 0;

  return (
    <button
      type="button"
      onClick={downloadFiles}
      disabled={isEmpty}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 14px",
        fontSize: 12,
        fontFamily: "'IBM Plex Mono', monospace",
        fontWeight: 500,
        borderRadius: 2,
        border: "1px solid var(--border-main)",
        cursor: isEmpty ? "not-allowed" : "pointer",
        background: isEmpty ? "transparent" : "var(--bg4)",
        color: isEmpty ? "var(--text3)" : "var(--green)",
        borderColor: isEmpty ? "var(--border-main)" : "var(--green)",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {isEmpty ? "no files" : `download (${files.length})`}
    </button>
  );
}