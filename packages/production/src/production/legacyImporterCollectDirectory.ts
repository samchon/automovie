import type { Dirent, Stats } from "node:fs";
import path from "node:path";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import { compareCodeUnits } from "./contentIdentity";
import { legacyImporterReadPhysicalFile } from "./legacyImporterReadPhysicalFile";
import { legacyImporterLstatOrNull } from "./legacyImporterLstatOrNull";

/**
 * Collect a physical legacy directory tree into captured byte and optional directory inventories, visiting each sorted child and rejecting symlinks and nonregular entries. An absent starting directory contributes nothing.
 *
 * @evidence contracts/common.md#principled-implementation Physical-directory admission and sorted dirent traversal establish deterministic path order before each file is read through segment and owned-file witnesses.
 * @evidence contracts/common.md#clear-and-simple-design One recursive collector supplies both resident project inventory and rollback baselines, parameterizing only whether directory paths are also recorded.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No link is traversed or special entry skipped as ordinary project content; unsupported file kinds refuse with their exact relative path.
 * @evidence contracts/common.md#meaningful-documentation Documents optional absence, deterministic traversal, byte ownership and link/special-entry refusal.
 * @evidence contracts/performance.md#efficient-algorithms Across F entries and B bytes, traversal adds per-directory child sorting and path work, with O(D) recursion plus retained B bytes and path inventories; populations have no numeric cap.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares physical-file reading and the same path comparator; repeated capture calls reread content because revision authority is supplied by their outer owner.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Native readers own descriptor cleanup; this collector retains buffers in the caller-supplied map and optional directory array until the snapshot/baseline consumer releases those references.
 */
export const legacyImporterCollectDirectory: (root: string, relative: string, files: Map<string, Uint8Array | null>, directories?: string[]) => void = (
  root: string,
  relative: string,
  files: Map<string, Uint8Array | null>,
  directories?: string[],
): void => {
  const absolute: string = path.join(root, ...relative.split("/"));
  const status: Stats | null = legacyImporterLstatOrNull(absolute);
  if (status === null) return;
  if (status.isSymbolicLink() || status.isDirectory() === false)
    throw new Error(
      `Legacy inventory directory "${absolute}" must be a physical directory.`,
    );
  for (const entry of fileSystem
    .readdirSync(absolute, { withFileTypes: true })
    .sort((left: Dirent<string>, right: Dirent<string>): number => compareCodeUnits(left.name, right.name))) {
    const child: string = `${relative}/${entry.name}`;
    if (entry.isSymbolicLink())
      throw new Error(
        `Legacy inventory path "${child}" is a symlink or junction. Replace it with physical project content before import.`,
      );
    if (entry.isDirectory()) {
      directories?.push(child);
      legacyImporterCollectDirectory(root, child, files, directories);
    } else if (entry.isFile())
      files.set(child, legacyImporterReadPhysicalFile(root, child, true)!);
    else
      throw new Error(
        `Legacy inventory path "${child}" is not a regular file or directory.`,
      );
  }
};
