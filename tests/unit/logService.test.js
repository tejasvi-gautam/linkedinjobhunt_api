import { jest } from "@jest/globals";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

describe("logService", () => {
  let originalCwd;
  let tmpDir;

  beforeEach(async () => {
    originalCwd = process.cwd();
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "apibot-logs-"));
    process.chdir(tmpDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(tmpDir, { recursive: true, force: true });
    jest.resetModules();
  });

  it("returns an empty array when logs do not exist", async () => {
    const { readApplicationLogs } = await import("../../services/logService.js");

    await expect(readApplicationLogs()).resolves.toEqual([]);
  });

  it("appends application logs to logs/applications.json", async () => {
    const { appendApplicationLogs, readApplicationLogs } = await import(
      "../../services/logService.js"
    );

    const entry = {
      company: "Acme",
      jobTitle: "Backend Intern",
      email: "careers@acme.com",
      timestamp: "2026-05-27T00:00:00.000Z",
      status: "sent"
    };

    await appendApplicationLogs([entry]);

    await expect(readApplicationLogs()).resolves.toEqual([entry]);
  });
});
