import fs from "node:fs";

import { ProcessOwnership } from "../../process/ProcessOwnership.js";

import type { IHumanViewerRecord } from "./IHumanViewerRecord.js";

/**
 * Write this process's record for its port, from the moment it owns the
 * port, so `status` and `stop` can verify ownership of a server that is
 * still starting.
 *
 * @evidence contracts/common.md#principled-implementation The record carries the answering owner PID and its actual OS creation stamp for reuse-safe stop admission.
 * @evidence contracts/common.md#clear-and-simple-design One process-record writer shares the existing OS-identity owner and leaves listener binding and subsequent stop admission to their callers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Writes the actual current process and port after ownership is established, refusing an unknown creation stamp instead of adopting another live PID.
 * @evidence contracts/common.md#meaningful-documentation States when the record is written and why.
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
