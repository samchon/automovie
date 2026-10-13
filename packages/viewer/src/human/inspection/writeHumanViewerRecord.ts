import fs from "node:fs";

import { ProcessOwnership } from "../../process/ProcessOwnership.js";

import type { IHumanViewerRecord } from "./IHumanViewerRecord.js";

/**
 * Write this process's record for its port, from the moment it owns the
 * port, so `status` and `stop` can verify ownership of a server that is
 * still starting.
 */
export function writeHumanViewerRecord(file: string, port: number): void {
  const processStartedAt = ProcessOwnership.read(process.pid);
  if (processStartedAt === null)
    throw new Error("Could not establish this viewer's process identity");
  const record: IHumanViewerRecord = {
    pid: process.pid,
    processStartedAt,
    startedAt: new Date().toISOString(),
    port,
  };
  fs.writeFileSync(file, JSON.stringify(record));
}
