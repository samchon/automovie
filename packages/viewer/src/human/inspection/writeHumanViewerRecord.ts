import fs from "node:fs";

import { ProcessOwnership } from "../../process/ProcessOwnership.js";
import type { IHumanViewerRecord } from "./IHumanViewerRecord.js";

/**
 * Write this process's record for its port, from the moment it owns the port, so `status` and `stop` can verify ownership of a server that is still starting.
 *
 * @evidence contracts/common.md#principled-implementation Writes current pid, actual OS creation identity, start text and owned listening port only after the caller has acquired that port.
 * @evidence contracts/common.md#clear-and-simple-design This writer serializes discovery metadata while ProcessOwnership supplies creation authority and the server controls publication timing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing creation identity refuses rather than writing a pid-only stop record; record existence does not claim a drawable model or successful source compilation.
 * @evidence contracts/common.md#meaningful-documentation Documentation states publication after port ownership and use by status/stop during startup.
 * @evidence contracts/performance.md#efficient-algorithms Native identity discovery dominates a fixed-size JSON write; no model bytes or directory tree are traversed.
 * @evidence contracts/performance.md#reuse-equivalent-work Each owner publishes its current process identity rather than reusing a previous record; replacement safety remains with port binding and stop admission.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The synchronous record write leaves no retained file handle; server/launcher ownership decides record lifetime and safe removal.
 */
export function writeHumanViewerRecord(file: string, port: number): void {
  const processStartedAt: ReturnType<typeof ProcessOwnership.read> =
    ProcessOwnership.read(process.pid);
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
