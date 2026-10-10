import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Signed separation of an upper/lower aperture pair along its opening axis.
 * The aperture owner uses the same projection before closure, and the pose
 * evaluator uses it after tissue contact on the final rendered positions.
 * Points share basis-frame metres; up is the caller's unit opening direction.
 * Positive means upper lies above lower, zero means a sealed projected pair,
 * and negative means their projected order reversed. It measures no tissue
 * mechanics and mutates no input.
 */
export function measureHumanFaceApertureGap(
  upper: IAutoMovieVector3,
  lower: IAutoMovieVector3,
  up: IAutoMovieVector3,
): number {
  return Vector3.dot(Vector3.subtract(upper, lower), up);
}
