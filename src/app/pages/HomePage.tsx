import { useState, useEffect, useCallback } from "preact/hooks";
import type { JobInfo } from "../../shared/rpc-types";
import { useElectrobun } from "../context/electrobun";
import { JobTable } from "../components/JobTable";

interface HomePageProps {
  profileName: string | null;
  refreshKey: number;
}

export function HomePage({ profileName, refreshKey }: HomePageProps) {
  const electrobun = useElectrobun();
  const [jobs, setJobs] = useState<JobInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    if (!profileName) return;
    setLoading(true);
    setError(null);
    try {
      const result = await electrobun.rpc.request.fetchJobs({ profileName });
      if (result.error) {
        setError(result.error);
      } else {
        setJobs(result.jobs);
      }
    } catch (err: any) {
      setError(err.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }, [electrobun, profileName]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs, refreshKey]);

  if (!profileName) {
    return (
      <div class="status-msg">
        <span class="spinner" /> Loading profiles...
      </div>
    );
  }

  if (loading) {
    return (
      <div class="status-msg">
        <span class="spinner" /> Loading jobs...
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div class="status-msg error">{error}</div>
        <div style={{ textAlign: "center", marginTop: "12px" }}>
          <button class="btn btn-primary" onClick={fetchJobs}>
            &#8635; Retry
          </button>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div class="empty-state">
        <div class="icon">{"\uD83D\uDCDA"}</div>
        No jobs found on this system.
      </div>
    );
  }

  return <JobTable jobs={jobs} onRefresh={fetchJobs} profileName={profileName} />;
}
