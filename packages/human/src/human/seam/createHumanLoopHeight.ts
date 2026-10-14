import type { IAutoMovieVector3 } from "@automovie/interface";

import { createHumanLoopAzimuth } from "./createHumanLoopAzimuth";

/**
 * Compile sampled loop height as piecewise-linear angular interpolation around the supplied Y-up vertical axis. Heights use the source metre frame; angles use radians from +Z towards +X. The azimuth owner checks sampled winding; finite radial geometry and distinct angular samples remain caller premises, since tied angles are accepted. This facade adds no full geometric or anatomical qualification. Points remain borrowed: changing their Y values affects reads while changing X/Z would invalidate captured correspondence.
 *
 * @evidence contracts/common.md#principled-implementation Actual neighbouring loop Y values and the shared cyclic angular bracket determine the nonplanar cut profile used by seam/face skin consumers.
 * @evidence contracts/common.md#clear-and-simple-design Angular admission/correspondence has one owner; this adapter only linearly reads height through its compiled bracket.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A nonplanar profile is not replaced by a fitted plane, and sampled height supplies no guaranteed anatomical contour, global embedding or current viewer observation.
 * @evidence contracts/common.md#meaningful-documentation Prose states metre/radian frame, piecewise interpolation and borrowed-point/captured-angle lifetime premise.
 * @evidence contracts/performance.md#efficient-algorithms O(N) azimuth preparation precedes O(log N) bracket plus fixed height arithmetic per query.
 * @evidence contracts/performance.md#reuse-equivalent-work One compiled cyclic correspondence serves repeated vertex queries without rebuilding loop angles or a height mesh.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains borrowed points and N-sized angular lookup until dropped; it acquires no asset task, worker or render resource.
 */
export function createHumanLoopHeight(
  points: readonly IAutoMovieVector3[],
  axis: { x: number; z: number },
): (angle: number) => number {
  const azimuth: ReturnType<typeof createHumanLoopAzimuth> = createHumanLoopAzimuth(points, axis);
  return (angle: number): number => {
    const { low, high, along }: ReturnType<typeof azimuth.bracket> = azimuth.bracket(angle);
    return points[low].y * (1 - along) + points[high].y * along;
  };
}
