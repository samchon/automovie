import type { IAutoMovieRecoveryMapPose } from "../structures/image/IAutoMovieRecoveryMapPose";

/**
 * Check the original exact first-pose identity gauge with indexed coefficients.
 *
 * @evidence contracts/common.md#principled-implementation The original nine identity-rotation and three zero-translation equalities are unchanged; sparse holes fail indexed comparison.
 * @evidence contracts/common.md#clear-and-simple-design One fixed predicate serves camera admission and the direct checkpoint's reporting preflight; active source indices alone do not establish numerical identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No approximate gauge, pose repair, normalization, population scan or capacity exception supplies a valid first pose.
 * @evidence contracts/common.md#meaningful-documentation True requires rotation length9, translation length3 and every original exact coefficient; callers retain their existing core error and charge ownership.
 * @evidence contracts/performance.md#efficient-algorithms Twelve indexed equalities and two length equalities use at most64 logical reads/comparisons/branches/return visits. The original camera admission retains its fixed owner envelope; new checkpoint preflight is included in its reporting setup256.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares the original fixed predicate rather than a second numerical gauge definition or another fit.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows one pose during this call and returns a boolean without an array, record, callback or handle.
 */
export function isRecoveryMapIdentityGauge(
  pose: IAutoMovieRecoveryMapPose,
): boolean {
  return (
    pose.rotation.length === 9 &&
    pose.translation.length === 3 &&
    pose.rotation[0] === 1 &&
    pose.rotation[1] === 0 &&
    pose.rotation[2] === 0 &&
    pose.rotation[3] === 0 &&
    pose.rotation[4] === 1 &&
    pose.rotation[5] === 0 &&
    pose.rotation[6] === 0 &&
    pose.rotation[7] === 0 &&
    pose.rotation[8] === 1 &&
    pose.translation[0] === 0 &&
    pose.translation[1] === 0 &&
    pose.translation[2] === 0
  );
}
