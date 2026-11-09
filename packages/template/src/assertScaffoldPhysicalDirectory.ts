import { type IScaffoldPhysicalDirectory } from "./IScaffoldPhysicalDirectory";
import { captureScaffoldPhysicalDirectory } from "./captureScaffoldPhysicalDirectory";

/**
 * Require that a captured directory's path still names the same ordinary directory with the same real path.
 *
 * @param ownership The earlier capture.
 * @throws When the path is now missing, a link, not a directory, or a different directory, or when its real path moved.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Revalidation recaptures the path and compares identity and real path, the two values that change when a directory is replaced or redirected, while a rename of an unrelated sibling leaves both intact.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The check reuses the capture function instead of a second stat routine, so capture and revalidation cannot disagree on what identity means.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A mismatch always throws; there is no tolerance for a changed identity and no retry.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states the two compared values and every condition that throws.
 * @evidence contracts/development/implementation.md#efficient-algorithms One `lstat`, one open with `fstat` and close, and one native real-path read per call, constant in the directory's contents.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The function exists to observe the file system again, so a cached answer would remove the check it performs.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Successful recapture completes its descriptor close before comparison; a close failure propagates and proves no release. This assertion retains only the call-local current record and owns no additional handle.
 */
export const assertScaffoldPhysicalDirectory: (
  ownership: IScaffoldPhysicalDirectory,
) => void = (ownership: IScaffoldPhysicalDirectory): void => {
  const current: IScaffoldPhysicalDirectory = captureScaffoldPhysicalDirectory(
    ownership.path,
  );
  if (
    current.identity !== ownership.identity ||
    current.real !== ownership.real
  )
    throw new Error(`scaffold directory changed generation: ${ownership.path}`);
};
