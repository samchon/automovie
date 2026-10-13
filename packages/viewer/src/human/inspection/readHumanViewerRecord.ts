import fs from "node:fs";

import type { IHumanViewerRecord } from "./IHumanViewerRecord.js";

/**
 * This port's process record, or null when no viewer of this checkout recorded one.
 * Parsing or reading an existing malformed record throws. The returned payload
 * is not proof of a living process; stop ownership must check its creation stamp.
 */
export function readHumanViewerRecord(file: string): IHumanViewerRecord | null {
  return fs.existsSync(file)
    ? (JSON.parse(fs.readFileSync(file, "utf8")) as IHumanViewerRecord)
    : null;
}
