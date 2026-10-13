import fs from "node:fs";
import path from "node:path";

/**
 * Store one thumbnail PNG atomically: the process writes its own temporary
 * file and renames it over the target, so a reader (the bulk route of the
 * same viewer) never sees a partial PNG. Each viewer has its own thumbnail
 * folder; the per-process name keeps the write safe even so.
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
