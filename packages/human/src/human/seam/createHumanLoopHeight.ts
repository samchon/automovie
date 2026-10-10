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
