import { type Stats } from "node:fs";
import path from "node:path";
import { readAutoMovieProductionOwnedFile } from "./productionRenderJob";
import { legacyImporterLstatOrNull } from "./legacyImporterLstatOrNull";

/**
 * Read a required or optional project-relative regular file only after each path segment is observed without links, then delegate byte acquisition to the canonical owned-file reader. Missing required files throw; optional absence returns null.
 *
 * @evidence contracts/common.md#principled-implementation Segment lstat checks reject symlink/junction traversal and a final regular-file check precedes the shared descriptor-based owned-file read.
 * @evidence contracts/common.md#clear-and-simple-design Owns legacy required/optional path admission while descriptor identity and byte reading stay in the canonical production reader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No linked file is accepted or absent required content fabricated; callers must supply already canonical relative paths because this helper does not independently reject dot or parent segments.
 * @evidence contracts/common.md#meaningful-documentation States required/optional absence, segment link refusal and the canonical-relative-path premise imposed by snapshot and fixed-state callers.
 * @evidence contracts/performance.md#efficient-algorithms For P path segments and B file bytes, admission performs O(P) stats and the owned reader O(B) byte work/storage; no byte-size cap is introduced.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the shared owned-file reader but renews segment/file witnesses per read, because a pathname alone does not establish unchanged content.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Descriptor lifetime belongs to the owned reader and only a byte buffer escapes; its caller owns buffer retention and failed native close remains the reader's reported failure.
 */
export const legacyImporterReadPhysicalFile: (root: string, relative: string, required: boolean) => Uint8Array | null = (
  root: string,
  relative: string,
  required: boolean,
): Uint8Array | null => {
  let current: string = root;
  let finalStatus: Stats | null = null;
  for (const segment of relative.split("/")) {
    current = path.join(current, segment);
    const status: Stats | null = legacyImporterLstatOrNull(current);
    if (status === null) {
      if (required)
        throw new Error(`Required legacy project file "${current}" is absent.`);
      return null;
    }
    if (status.isSymbolicLink())
      throw new Error(
        `Legacy project path "${current}" is a symlink or junction. Replace it with physical project content before import.`,
      );
    finalStatus = status;
  }
  if (finalStatus?.isFile() !== true)
    throw new Error(`Legacy project path "${current}" is not a regular file.`);
  return readAutoMovieProductionOwnedFile({
    root,
    directory: root,
    relative,
  });
};
