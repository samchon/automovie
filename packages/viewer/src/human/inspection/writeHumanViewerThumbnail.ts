import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createAutoMovieResourceRetirement } from "../../createAutoMovieResourceRetirement.js";

/**
 * Publish one complete PNG by same-directory temporary write and atomic rename. Each invocation owns a UUID temporary path and attempts its removal on success or failure while retaining the primary publication cause. The caller supplies current thumbnail identity; this writer does not certify source, document or camera authority.
 *
 * @evidence contracts/common.md#principled-implementation Writes complete PNG bytes to a unique owned temporary path and atomically renames it into the target within the same directory.
 * @evidence contracts/common.md#clear-and-simple-design One awaited operation owns directory preparation, file publication and failed/successful temporary-file retirement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Independent writes cannot share one pid-only temporary pathname, and publication failure does not leave the owned temporary unattempted for cleanup.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies atomic replacement, unique per-write ownership and failure cleanup; current-source authority remains with the caller.
 * @evidence contracts/performance.md#efficient-algorithms Directory preparation and writing/renaming scale with PNG bytes and filesystem work; no PNG decode or duplicate input-buffer copy is added.
 * @evidence contracts/performance.md#reuse-equivalent-work Each write is a distinct publication effect; matching paths do not merge writes or certify matching source/document authority.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The owned UUID temporary is removed after success or failure with primary cause retained; the caller keeps input PNG bytes until settlement and committed thumbnails are pruned by their store owner.
 */
export async function writeHumanViewerThumbnail(
  file: string,
  png: Buffer,
): Promise<void> {
  await fs.promises.mkdir(path.dirname(file), { recursive: true });
  const temporary: string = `${file}.${process.pid}.${randomUUID()}.tmp`;
  let primary: { error: unknown } | undefined;
  try {
    await fs.promises.writeFile(temporary, png);
    await fs.promises.rename(temporary, file);
  } catch (error) {
    primary = { error };
    throw error;
  } finally {
    const remove: () => Promise<void> = async (): Promise<void> => { await fs.promises.rm(temporary, { force: true }); };
    if (primary === undefined) await createAutoMovieResourceRetirement([remove])();
    else await createAutoMovieResourceRetirement([remove], primary)();
  }
}
