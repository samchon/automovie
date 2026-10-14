import { describeCommitLockHolder, inspectCommitLock } from "../project/commitLock";
import { compareCodeUnits } from "./contentIdentity";

/**
 * When at least two requested coordinates currently have holders and the primary cause is an Error, retain that cause and report the full observed holder set. Otherwise return the original cause unchanged.
 *
 * @evidence contracts/common.md#principled-implementation A fresh sorted distinct-path survey names current holder facts rather than assuming the first failed coordinate is the only blocker.
 * @evidence contracts/common.md#clear-and-simple-design Owns multi-coordinate refusal context; single-holder descriptions and process evidence remain with the shared commit-lock survey.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only present holder observations are reported, and a non-Error primary value is returned unchanged instead of replaced by a fabricated error.
 * @evidence contracts/common.md#meaningful-documentation States the two-holder/Error threshold, original-cause preservation and that holder surveys are finite, non-atomic observations.
 * @evidence contracts/performance.md#efficient-algorithms Deduplicating and sorting C paths costs expected O(C) plus O(C log C), followed by C token/process surveys and output-length message construction.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses shared holder inspection and descriptions, while each current survey is renewed after acquisition failure rather than taken from an earlier attempt.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns the original cause or one Error retaining it; survey descriptors remain scoped to their reader and no lock ownership is acquired.
 */
export const productionRootNamespaceContendedCoordinatesError: (paths: readonly string[], cause: unknown) => unknown = (
  paths: readonly string[],
  cause: unknown,
): unknown => {
  const holders: NonNullable<ReturnType<typeof inspectCommitLock>>[] = [...new Set(paths)]
    .sort(compareCodeUnits)
    .map((lockPath: string): ReturnType<typeof inspectCommitLock> => inspectCommitLock(lockPath))
    .filter((holder: ReturnType<typeof inspectCommitLock>): holder is NonNullable<ReturnType<typeof inspectCommitLock>> => holder !== null);
  if (holders.length < 2 || cause instanceof Error === false) return cause;
  return new Error(
    `${cause.message}\n\nThis operation fences ${new Set(paths).size} coordinates and ${holders.length} of them are held, so clearing the one named above is not enough:\n${holders
      .map((holder: NonNullable<ReturnType<typeof inspectCommitLock>>): string => `- ${describeCommitLockHolder(holder)}`)
      .join("\n")}`,
    { cause },
  );
};
