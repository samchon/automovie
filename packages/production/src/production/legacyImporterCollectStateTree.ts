import path from "node:path";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import { compareCodeUnits } from "./contentIdentity";
import { legacyImporterChangedImportError } from "./legacyImporterChangedImportError";

/**
 * Collect the complete applied-state directory/file path population, rejecting links and nonregular entries, then sort both inventories by code units. File bytes are verified by a separate reader.
 *
 * @evidence contracts/common.md#principled-implementation Actual dirent traversal supplies complete path membership, with link/special-entry refusal before expected-population comparison.
 * @evidence contracts/common.md#clear-and-simple-design Separates topology membership from byte equality so exact-state verification can reject unexpected paths before reading expected files.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No expected path list substitutes for the observed tree; encountered links or special entries fail through the established changed-import error.
 * @evidence contracts/common.md#meaningful-documentation States complete directory/file inventory, deterministic order and the separate byte-verification boundary.
 * @evidence contracts/performance.md#efficient-algorithms Visits F entries with O(D) recursion and sorts directory/file inventories in O(F log F) comparisons, retaining all path strings without a count/depth cap.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses the shared comparator but deliberately rereads current topology rather than reusing a prior plan population.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains path arrays for its caller's current comparison and no descriptor; native readdir returns values and temporary dirent arrays expire by scope.
 */
export const legacyImporterCollectStateTree: (root: string) => { directories: string[]; files: string[] } = (
  root: string,
): { directories: string[]; files: string[] } => {
  const directories: string[] = [];
  const files: string[] = [];
  const visit: (directory: string) => void = (directory: string): void => {
    for (const entry of fileSystem.readdirSync(directory, {
      withFileTypes: true,
    })) {
      const absolute: string = path.join(directory, entry.name);
      const relative: string = path.relative(root, absolute).split(path.sep).join("/");
      if (entry.isSymbolicLink()) throw legacyImporterChangedImportError(root, relative);
      if (entry.isDirectory()) {
        directories.push(relative);
        visit(absolute);
      } else if (entry.isFile()) files.push(relative);
      else throw legacyImporterChangedImportError(root, relative);
    }
  };
  visit(root);
  return {
    directories: directories.sort(compareCodeUnits),
    files: files.sort(compareCodeUnits),
  };
};
