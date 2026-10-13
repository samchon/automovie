import fs from "node:fs";

import type { IHumanViewerRecord } from "./IHumanViewerRecord.js";

/**
 * This port's process record, or null when no viewer of this checkout recorded one.
 * Parsing or reading an existing malformed record throws. The returned payload
 * is not proof of a living process; stop ownership must check its creation stamp.
 *
 * @evidence contracts/common.md#meaningful-documentation States the null meaning.
 * @evidence contracts/common.md#principled-implementation Returns the actual stored JSON or absence; current process existence and creation identity remain separate checks.
 * @evidence contracts/common.md#clear-and-simple-design One filesystem reader supplies the record to status and stop consumers without deciding their process policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not synthesize missing ownership, adopt a process by executable name or treat a stored PID as termination authority.
 */
export function readHumanViewerRecord(file: string): IHumanViewerRecord | null {
  return fs.existsSync(file)
    ? (JSON.parse(fs.readFileSync(file, "utf8")) as IHumanViewerRecord)
    : null;
}
