import type { JobInfo, SpoolFileInfo, ProfileSummary } from "./rpc-types";

export function mapJob(raw: any): JobInfo {
  return {
    jobname: raw.jobname,
    jobid: raw.jobid,
    owner: raw.owner ?? "",
    status: raw.status ?? "",
    retcode: raw.retcode ?? null,
    class: raw.class ?? "",
    phaseName: raw["phase-name"] ?? "",
  };
}

export function mapSpoolFile(raw: any): SpoolFileInfo {
  return {
    id: raw.id,
    ddname: raw.ddname,
    stepname: raw.stepname ?? "",
    byteCount: raw["byte-count"] ?? 0,
    recordCount: raw["record-count"] ?? 0,
  };
}

export function selectProfile(
  profiles: ProfileSummary[],
  name?: string
): ProfileSummary | undefined {
  if (name) return profiles.find((p) => p.name === name);
  return profiles.find((p) => p.isDefault) ?? profiles[0];
}
