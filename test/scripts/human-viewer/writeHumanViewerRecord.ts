import fs from "node:fs";

import type { IHumanViewerRecord } from "./IHumanViewerRecord";

/**
 * Write this process's record for its port, from the moment it owns the
 * port, so `status` and `stop` can verify ownership of a server that is
 * still starting.
 *
 * @evidence contracts/common.md#principled-implementation The record carries the pid that ownership checks compare with the live server.
 * @evidence contracts/common.md#meaningful-documentation States when the record is written and why.
 */
export function writeHumanViewerRecord(file: string, port: number): void {
  const record: IHumanViewerRecord = { pid: process.pid, startedAt: new Date().toISOString(), port };
  fs.writeFileSync(file, JSON.stringify(record));
}
