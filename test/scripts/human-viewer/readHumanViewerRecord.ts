import fs from "node:fs";

import type { IHumanViewerRecord } from "./IHumanViewerRecord";

/**
 * This port's process record, or null when no viewer of this checkout recorded one.
 *
 * @evidence contracts/common.md#meaningful-documentation States the null meaning.
 */
export function readHumanViewerRecord(file: string): IHumanViewerRecord | null {
  return fs.existsSync(file)
    ? (JSON.parse(fs.readFileSync(file, "utf8")) as IHumanViewerRecord)
    : null;
}
