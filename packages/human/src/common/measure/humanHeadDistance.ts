import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The straight distance between two head points, in metres, as a caliper
 * reads it.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Math.hypot of coordinate differences gives the Euclidean straight distance between two metre-valued points in the same head frame; callers own finite source coordinates and clinical landmark registration.
 * @evidence contracts/common.md#clear-and-simple-design One fixed-dimensional norm owns the caliper distance, leaving point search and source interpretation to callers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No expected facial distance, per-consumer offset or alternative norm changes the three-axis calculation.
 * @evidence contracts/common.md#meaningful-documentation The public comment states straight caliper distance and metre units for head-point inputs.
 * @evidence contracts/performance.md#efficient-algorithms Three differences and one three-component hypot require constant work and auxiliary storage.
 * @evidence contracts/performance.md#reuse-equivalent-work The norm coordinates no repeated measurement pipeline and maintains no input/result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a scalar result escapes; the borrowed point records remain caller-owned and no buffers, tasks or handles are acquired.
 */
export function humanHeadDistance(
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}
