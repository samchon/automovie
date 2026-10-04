import fs from "node:fs";
import path from "node:path";

/**
 * Store one thumbnail PNG atomically. Viewers on other ports share the
 * thumbnail directory, so each process writes its own temporary file and
 * renames it over the target; a reader never sees a partial PNG.
 *
 * @evidence contracts/common.md#principled-implementation A per-process temporary file and rename keep concurrent writers from exposing partial bytes.
 * @evidence contracts/common.md#meaningful-documentation States the sharing and atomicity it serves.
 */
export async function writeHumanViewerThumbnail(file: string, png: Buffer): Promise<void> {
  await fs.promises.mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  await fs.promises.writeFile(temporary, png);
  await fs.promises.rename(temporary, file);
}
