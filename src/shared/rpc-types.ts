import type { RPCSchema } from "electrobun/bun";

export type ProfileSummary = {
  name: string;
  host: string;
  port: number;
  isDefault: boolean;
};

export type JobInfo = {
  jobname: string;
  jobid: string;
  owner: string;
  status: string;
  retcode: string | null;
  class: string;
  phaseName: string;
};

export type SpoolFileInfo = {
  id: number;
  ddname: string;
  stepname: string;
  byteCount: number;
  recordCount: number;
};

export type ZoweRPCType = {
  bun: RPCSchema<{
    requests: {
      listProfiles: {
        params: Record<string, never>;
        response: { profiles: ProfileSummary[]; error?: string };
      };
      fetchJobs: {
        params: { profileName?: string };
        response: { jobs: JobInfo[]; error?: string };
      };
      getSpoolFiles: {
        params: { jobname: string; jobid: string; profileName?: string };
        response: { files: SpoolFileInfo[]; error?: string };
      };
      openSpoolFile: {
        params: { jobname: string; jobid: string; id: number; profileName?: string };
        response: { success: boolean; error?: string };
      };
    };
    messages: Record<string, never>;
  }>;
  webview: RPCSchema<{
    requests: Record<string, never>;
    messages: Record<string, never>;
  }>;
};
