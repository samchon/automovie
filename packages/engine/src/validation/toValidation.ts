import {
  IAutoMovieConstraintViolation,
  IAutoMovieValidation,
} from "@automovie/interface";

/**
 * Return failure with the supplied violation array when any error exists, otherwise return the same array as warnings or an empty success record.
 *
 * @evidence contracts/common.md#principled-implementation Search for error severity, returning the entire borrowed input array as violations on failure or warnings on nonempty advisory-only success.
 * @evidence contracts/common.md#clear-and-simple-design This canonical conversion is shared by raw artifact gates and ViolationCollector.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Warnings remain visible rather than becoming errors or silently disappearing.
 * @evidence contracts/common.md#meaningful-documentation The result aliases the supplied mutable array; error results preserve warning rows alongside errors instead of partitioning them.
 * @evidence contracts/performance.md#efficient-algorithms V rows require O(V) worst-case early-stoppable severity search and one result wrapper, with O(1) auxiliary storage.
 * @evidence contracts/performance.md#reuse-equivalent-work The original array/rows are reused without copying, while the error decision is recomputed for each current list.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The input owner controls the aliased array/row lifetime; the helper retains no validation session.
 */
export const toValidation: (violations: IAutoMovieConstraintViolation[]) => IAutoMovieValidation = (
  violations: IAutoMovieConstraintViolation[],
): IAutoMovieValidation => {
  if (violations.some((v: IAutoMovieConstraintViolation): boolean => v.severity === "error"))
    return { success: false, violations };
  if (violations.length > 0) return { success: true, warnings: violations };
  return { success: true };
};
