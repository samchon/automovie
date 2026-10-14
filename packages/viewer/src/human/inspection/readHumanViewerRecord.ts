import fs from "node:fs";

import type { IHumanViewerRecord } from "./IHumanViewerRecord.js";

/**
 * This port's process record, or null when no viewer of this checkout recorded one. Parsing or reading an existing malformed record throws. The returned payload is not proof of a living process; stop ownership must check its creation stamp.
 *
 * @evidence contracts/common.md#principled-implementation Decodes an existing JSON record and requires a positive safe process id, supported integer port, nonempty start text and a nonempty optional creation stamp.
 * @evidence contracts/common.md#clear-and-simple-design One reader returns null for an absent record and throws for malformed existing bytes, keeping discovery separate from process ownership and stop policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A legacy record may omit the creation stamp but cannot thereby authorize identity-safe termination; start text is not claimed to be a validated timestamp.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies refusal, field checks and the weaker legacy discovery contract without asserting process liveness.
 * @evidence contracts/performance.md#efficient-algorithms Reading and parsing cost scale with record bytes, followed by fixed scalar checks; no process enumeration is performed here.
 * @evidence contracts/performance.md#reuse-equivalent-work Each discovery reads current record bytes rather than retaining a process record across replacement or ownership changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Synchronous file reading leaves no open handle; the returned small record is caller-owned and no process is acquired or killed.
 */
export function readHumanViewerRecord(file: string): IHumanViewerRecord | null {
  if (!fs.existsSync(file)) return null;
  const value: unknown = JSON.parse(fs.readFileSync(file, "utf8"));
  if (value === null || typeof value !== "object" || Array.isArray(value) ||
      !("pid" in value) || typeof value.pid !== "number" || !Number.isSafeInteger(value.pid) || value.pid <= 0 ||
      !("port" in value) || typeof value.port !== "number" || !Number.isInteger(value.port) || value.port < 1024 || value.port > 65535 ||
      !("startedAt" in value) || typeof value.startedAt !== "string" || value.startedAt === "" ||
      ("processStartedAt" in value && (typeof value.processStartedAt !== "string" || value.processStartedAt === "")))
    throw new Error("The viewer process record has malformed ownership fields.");
  return value as IHumanViewerRecord;
}
