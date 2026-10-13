import fs from "node:fs";
import path from "node:path";

/**
 * Store one thumbnail PNG atomically: the process writes its own temporary
 * file and renames it over the target, so a reader (the bulk route of the
 * same viewer) never sees a partial PNG. Each viewer has its own thumbnail
 * folder; the per-process name keeps the write safe even so.
 *
 * @evidence contracts/common.md#principled-implementation A per-process temporary file and rename never expose partial bytes.
 * @evidence contracts/common.md#clear-and-simple-design One PNG writer owns directory creation, temporary publication and final rename for its caller-selected target.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Stores the actual supplied capture bytes without image synthesis, subject-specific rewrites or deleting another viewer's thumbnail directory.
 * @evidence contracts/common.md#meaningful-documentation States the atomicity it serves and the folder ownership.
 */
export async function writeHumanViewerThumbnail(
  file: string,
  png: Buffer,
): Promise<void> {
  await fs.promises.mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  await fs.promises.writeFile(temporary, png);
  await fs.promises.rename(temporary, file);
}
