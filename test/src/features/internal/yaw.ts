import { IAutoMovieQuaternion } from "@automovie/interface";

/**
 * Encode the stair fixture's radian angle as a +Y quaternion using sine/cosine of its half-angle, independently of the production quaternion constructor. The caller supplies the finite angle; no input admission or output normalization changes it, and trigonometric rounding remains.
 *
 * Constant scalar work returns a fresh quaternion with no retained angle, cache or resource; the parent observes resulting placement and volume rather than independently certifying every quaternion component.
 */
export const yaw: (radians: number) => IAutoMovieQuaternion = (
  radians: number,
): IAutoMovieQuaternion => ({
  x: 0,
  y: Math.sin(radians / 2),
  z: 0,
  w: Math.cos(radians / 2),
});
