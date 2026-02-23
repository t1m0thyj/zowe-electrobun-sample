import { useState, useEffect } from "preact/hooks";
import type { SpoolFileInfo } from "../../shared/rpc-types";
import { useElectrobun } from "../context/electrobun";

interface SpoolFileListProps {
  jobname: string;
  jobid: string;
  profileName?: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[i]}`;
}

export function SpoolFileList({ jobname, jobid, profileName }: SpoolFileListProps) {
  const electrobun = useElectrobun();
  const [files, setFiles] = useState<SpoolFileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    electrobun.rpc.request.getSpoolFiles({ jobname, jobid, profileName }).then((result) => {
      if (result.error) {
        setError(result.error);
      } else {
        setFiles(result.files);
      }
      setLoading(false);
    }).catch((err: any) => {
      setError(err.message ?? String(err));
      setLoading(false);
    });
  }, [electrobun, jobname, jobid]);

  const openFile = async (file: SpoolFileInfo) => {
    setOpeningId(file.id);
    try {
      const result = await electrobun.rpc.request.openSpoolFile({
        jobname,
        jobid,
        id: file.id,
        profileName,
      });
      if (result.error) {
        console.error("Failed to open spool file:", result.error);
      }
    } catch (err: any) {
      console.error("Failed to open spool file:", err);
    } finally {
      setOpeningId(null);
    }
  };

  if (loading) {
    return (
      <div class="spool-loading">
        <span class="spinner" /> Loading spool files...
      </div>
    );
  }

  if (error) {
    return <div class="spool-error">{error}</div>;
  }

  if (files.length === 0) {
    return <div class="spool-empty">No spool files found.</div>;
  }

  return (
    <div class="spool-list">
      {files.map((f) => (
        <button
          key={f.id}
          class="spool-item"
          onClick={() => openFile(f)}
          disabled={openingId === f.id}
        >
          <span class="spool-icon">{"\uD83D\uDCC4"}</span>
          <span class="spool-ddname">{f.ddname}</span>
          <span class="spool-meta">
            {formatBytes(f.byteCount)}, {f.recordCount} lines
          </span>
          {openingId === f.id && <span class="spinner spool-spinner" />}
        </button>
      ))}
    </div>
  );
}
