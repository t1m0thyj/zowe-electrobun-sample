import { BrowserWindow, ApplicationMenu, BrowserView } from "electrobun/bun";
import type { ZoweRPCType } from "../shared/rpc-types";
import { mapJob, mapSpoolFile } from "../shared/mappers";
import { GetJobs } from "@zowe/zos-jobs-for-zowe-sdk";
import { Logger, LoggingConfigurer, ProfileInfo } from "@zowe/imperative";
import { tmpdir } from "os";
import { join } from "path";
import { writeFileSync } from "fs";
import { spawn } from "child_process";

Logger.initLogger(LoggingConfigurer.configureLogger(".zowe-viewer", { name: "zowe-viewer" }));

ApplicationMenu.setApplicationMenu([
  {
    submenu: [{ label: "Quit", role: "quit" }],
  },
  {
    label: "Edit",
    submenu: [
      { role: "undo" },
      { role: "redo" },
      { type: "separator" },
      { role: "cut" },
      { role: "copy" },
      { role: "paste" },
      { role: "selectAll" },
    ],
  },
]);

let cachedProfInfo: ProfileInfo | null = null;

async function loadProfileInfo(forceReload = false) {
  if (!cachedProfInfo || forceReload) {
    const profInfo = new ProfileInfo("zowe");
    await profInfo.readProfilesFromDisk();
    cachedProfInfo = profInfo;
  }
  return cachedProfInfo;
}

function createSessionForProfile(profInfo: ProfileInfo, profileName?: string) {
  const attrs = profileName
    ? profInfo.getAllProfiles("zosmf").find((p) => p.profName === profileName)
    : profInfo.getDefaultProfile("zosmf");

  if (!attrs) return null;

  const merged = profInfo.mergeArgsForProfile(attrs, { getSecureVals: true });
  return ProfileInfo.createSession(merged.knownArgs);
}

const rpc = BrowserView.defineRPC<ZoweRPCType>({
  maxRequestTime: 30000,
  handlers: {
    requests: {
      listProfiles: async () => {
        try {
          const profInfo = await loadProfileInfo();
          const defaultProf = profInfo.getDefaultProfile("zosmf");
          const allProfs = profInfo.getAllProfiles("zosmf");

          return {
            profiles: allProfs.map((p) => {
              const merged = profInfo.mergeArgsForProfile(p, { getSecureVals: false });
              const host = merged.knownArgs.find((a) => a.argName === "host")?.argValue ?? "";
              const port = merged.knownArgs.find((a) => a.argName === "port")?.argValue ?? 443;
              return {
                name: p.profName,
                host: String(host),
                port: Number(port),
                isDefault: defaultProf?.profName === p.profName,
              };
            }),
          };
        } catch (err: any) {
          console.error("[listProfiles] Error:", err);
          return { profiles: [], error: err.message ?? String(err) };
        }
      },

      fetchJobs: async ({ profileName }) => {
        try {
          const profInfo = await loadProfileInfo();
          const session = createSessionForProfile(profInfo, profileName);
          if (!session) {
            return { jobs: [], error: `No zosmf profile found${profileName ? ` named "${profileName}"` : ""}` };
          }
          const jobs = await GetJobs.getJobs(session);
          return { jobs: jobs.map(mapJob) };
        } catch (err: any) {
          console.error("[fetchJobs] Error:", err);
          return { jobs: [], error: err.message ?? String(err) };
        }
      },

      getSpoolFiles: async ({ jobname, jobid, profileName }) => {
        try {
          const profInfo = await loadProfileInfo();
          const session = createSessionForProfile(profInfo, profileName);
          if (!session) {
            return { files: [], error: "No default zosmf profile found" };
          }
          const spoolFiles = await GetJobs.getSpoolFilesForJob(session, { jobname, jobid } as any);
          return { files: spoolFiles.map(mapSpoolFile) };
        } catch (err: any) {
          console.error("[getSpoolFiles] Error:", err);
          return { files: [], error: err.message ?? String(err) };
        }
      },

      openSpoolFile: async ({ jobname, jobid, id, profileName }) => {
        try {
          const profInfo = await loadProfileInfo();
          const session = createSessionForProfile(profInfo, profileName);
          if (!session) {
            return { success: false, error: "No default zosmf profile found" };
          }

          const spoolFiles = await GetJobs.getSpoolFilesForJob(session, { jobname, jobid } as any);
          const file = spoolFiles.find((f) => f.id === id);
          if (!file) {
            return { success: false, error: `Spool file id=${id} not found` };
          }

          const content = await GetJobs.getSpoolContent(session, file);
          const outPath = join(tmpdir(), `${jobname}_${file.ddname}_${jobid}.txt`);
          writeFileSync(outPath, content);
          spawn("open", [outPath], { detached: true, stdio: "ignore" });

          return { success: true };
        } catch (err: any) {
          console.error("[openSpoolFile] Error:", err);
          return { success: false, error: err.message ?? String(err) };
        }
      },
    },
    messages: {},
  },
});

const win = new BrowserWindow({
  title: "Zowe Jobs Viewer",
  url: "views://app/index.html",
  rpc,
});
