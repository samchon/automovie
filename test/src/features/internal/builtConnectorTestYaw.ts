import type { IAutoMovieQuaternion } from "@automovie/interface";

/** Construct the fixture's Y-axis half-angle quaternion for an authored radian angle.
 *
 * Both levels construction and the connector unit's expected quarter-turn values use this helper, so matching them does not independently verify quaternion construction. Finite-angle admission and equality tolerances belong to the consumers. This synchronous internal helper returns a fresh record, retains no state and starts no process or renderer.
 *
 * @param radians Right-handed Y-axis angle in radians.
 * @returns The sine/cosine quaternion without additional normalization.
 */
export const builtConnectorTestYaw: (radians: number) => IAutoMovieQuaternion = (
  radians: number,
): IAutoMovieQuaternion => ({
  x: 0,
  y: Math.sin(radians / 2),
  z: 0,
  w: Math.cos(radians / 2),
});
