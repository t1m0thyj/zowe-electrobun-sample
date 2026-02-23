import { describe, test, expect } from "bun:test";
import { mapJob, mapSpoolFile, selectProfile } from "../shared/mappers";
import type { ProfileSummary } from "../shared/rpc-types";

describe("mapJob", () => {
  test("maps hyphenated phase-name to phaseName", () => {
    const result = mapJob({
      jobname: "MYJOB", jobid: "JOB001",
      owner: "USR", status: "ACTIVE", retcode: null, class: "A",
      "phase-name": "Running",
    });
    expect(result.phaseName).toBe("Running");
  });

  test("defaults missing optional fields", () => {
    const result = mapJob({ jobname: "BARE", jobid: "JOB999" });
    expect(result.owner).toBe("");
    expect(result.status).toBe("");
    expect(result.retcode).toBeNull();
    expect(result.class).toBe("");
    expect(result.phaseName).toBe("");
  });

  test("preserves retcode when present", () => {
    const result = mapJob({
      jobname: "J", jobid: "J1",
      retcode: "CC 0004",
    });
    expect(result.retcode).toBe("CC 0004");
  });
});

describe("mapSpoolFile", () => {
  test("maps hyphenated byte-count and record-count", () => {
    const result = mapSpoolFile({
      id: 3, ddname: "SYSOUT", stepname: "STEP1",
      "byte-count": 2048, "record-count": 100,
    });
    expect(result.byteCount).toBe(2048);
    expect(result.recordCount).toBe(100);
  });

  test("defaults missing counts to zero", () => {
    const result = mapSpoolFile({ id: 1, ddname: "JESMSGLG" });
    expect(result.byteCount).toBe(0);
    expect(result.recordCount).toBe(0);
    expect(result.stepname).toBe("");
  });
});

describe("selectProfile", () => {
  const profiles: ProfileSummary[] = [
    { name: "prod", host: "prod.example.com", port: 443, isDefault: false },
    { name: "dev", host: "dev.example.com", port: 10443, isDefault: true },
  ];

  test("selects by name when provided", () => {
    expect(selectProfile(profiles, "prod")!.host).toBe("prod.example.com");
  });

  test("returns default when no name given", () => {
    expect(selectProfile(profiles)!.name).toBe("dev");
  });

  test("returns undefined for unknown name", () => {
    expect(selectProfile(profiles, "nope")).toBeUndefined();
  });

  test("falls back to first profile when none is default", () => {
    const noDefault: ProfileSummary[] = [
      { name: "a", host: "a.com", port: 443, isDefault: false },
      { name: "b", host: "b.com", port: 443, isDefault: false },
    ];
    expect(selectProfile(noDefault)!.name).toBe("a");
  });

  test("returns undefined for empty list with no name", () => {
    expect(selectProfile([])).toBeUndefined();
  });
});
