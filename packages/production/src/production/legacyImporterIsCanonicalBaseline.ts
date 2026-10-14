import { IAutoMovieLegacyOwnedDirectoryBaseline } from "@automovie/interface";
import { compareCodeUnits } from "./contentIdentity";
import { legacyImporterIsCanonicalBaselinePath } from "./legacyImporterIsCanonicalBaselinePath";

/**
 * Check one ordered rollback-baseline root and its strictly sorted child-directory/file paths, requiring project-kind files with nonnull digest and nonnegative safe byte counts. These checks describe a record, not current filesystem bytes.
 *
 * @evidence contracts/common.md#principled-implementation Expected root, absent-empty semantics, canonical descendant paths and strict code-unit order establish the established baseline representation before rollback comparison.
 * @evidence contracts/common.md#clear-and-simple-design Uses a shared descendant-path predicate and one pass over each sorted population without owning hashing or filesystem reads.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not claim digest spelling, case-folded cross-kind uniqueness or current byte existence beyond its actual checks; those stronger properties are not added as a compatibility shortcut.
 * @evidence contracts/common.md#meaningful-documentation Documents root/order/absence and supported file refinements, with record-versus-live-state limits.
 * @evidence contracts/performance.md#efficient-algorithms For D directories and F files, one pass plus path/previous-string comparisons costs their total character lengths and O(1) auxiliary previous-path references.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses expected root and path comparator across entries; prior validation of a mutable baseline is not cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains only current/previous path references during the call and acquires no descriptor or baseline byte buffer.
 */
export const legacyImporterIsCanonicalBaseline: (baseline: IAutoMovieLegacyOwnedDirectoryBaseline, expectedPath: IAutoMovieLegacyOwnedDirectoryBaseline["path"]) => boolean = (
  baseline: IAutoMovieLegacyOwnedDirectoryBaseline,
  expectedPath: IAutoMovieLegacyOwnedDirectoryBaseline["path"],
): boolean => {
  if (
    baseline.path !== expectedPath ||
    (baseline.existed === false &&
      (baseline.directories.length !== 0 || baseline.files.length !== 0))
  )
    return false;
  let previousDirectory: string | null = null;
  for (const directory of baseline.directories) {
    if (
      legacyImporterIsCanonicalBaselinePath(directory, expectedPath) === false ||
      (previousDirectory !== null &&
        compareCodeUnits(previousDirectory, directory) >= 0)
    )
      return false;
    previousDirectory = directory;
  }
  let previous: string | null = null;
  for (const file of baseline.files) {
    if (
      file.kind !== "project" ||
      file.digest === null ||
      file.bytes < 0 ||
      Number.isSafeInteger(file.bytes) === false ||
      legacyImporterIsCanonicalBaselinePath(file.path, expectedPath) === false ||
      (previous !== null && compareCodeUnits(previous, file.path) >= 0)
    )
      return false;
    previous = file.path;
  }
  return true;
};
