import fs from "node:fs/promises";
import path from "node:path";

const LOG_DIR = path.resolve(process.cwd(), "logs");
const APPLICATION_LOG = path.join(LOG_DIR, "applications.json");

export async function appendApplicationLogs(entries) {
  await fs.mkdir(LOG_DIR, { recursive: true });

  const existingLogs = await readApplicationLogs();
  const nextLogs = [...existingLogs, ...entries];

  await fs.writeFile(APPLICATION_LOG, JSON.stringify(nextLogs, null, 2));

  return nextLogs;
}

export async function readApplicationLogs() {
  try {
    const raw = await fs.readFile(APPLICATION_LOG, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}
