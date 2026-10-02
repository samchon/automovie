import type { IAutoMovieVector3 } from "@automovie/interface";

import { createHumanLoopAzimuth } from "./createHumanLoopAzimuth";

/**
 * The height of a closed loop as a function of azimuth about a vertical axis:
 * the loop's `y` interpolated linearly in the angle between the two loop
 * vertices that bracket it.
 *
 * A neck's cut is not planar (the face's loop is lowest under the chin and
 * highest at the nape), so "above the cut" means above this profile, not above
 * one plane. The loop must wind once about the axis in one direction, as
 * `createHumanLoopAzimuth` requires.
 *
 * @evidence contracts/common.md#principled-implementation Linear interpolation in the angle between the bracketing vertices is a piecewise-linear height profile of a star-shaped loop: it is exact at every loop vertex and, between two vertices, differs from the height of the straight edge by the edge's own tilt against the radial direction, which the loop's sampling keeps to a fraction of an edge length.
 * @evidence contracts/common.md#clear-and-simple-design A thin closure over the azimuth lookup, so the seam and the face weighting read one profile.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No loop or height is assumed; an invalid loop refuses through the azimuth lookup.
 * @evidence contracts/common.md#meaningful-documentation The comment states why the cut is a profile and not a plane, and the winding precondition.
 * @evidence contracts/modeling.md#spatial-conventions Metres, Y up; angle from +Z towards +X about the vertical through `axis`.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function reads a profile and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary; it reads the height of one.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function defines no input a caller shapes a human form with.
 */
export function createHumanLoopHeight(
  points: readonly IAutoMovieVector3[],
  axis: { x: number; z: number },
): (angle: number) => number {
  const azimuth = createHumanLoopAzimuth(points, axis);
  return (angle) => {
    const { low, high, along } = azimuth.bracket(angle);
    return points[low].y * (1 - along) + points[high].y * along;
  };
}
