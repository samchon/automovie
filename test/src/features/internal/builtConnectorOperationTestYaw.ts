import type { IAutoMovieQuaternion } from "@automovie/interface";

/** Construct a unit rotation about the world Y axis for the stated angle in radians. */
export const builtConnectorOperationTestYaw = (
  radians: number,
): IAutoMovieQuaternion => ({
  x: 0,
  y: Math.sin(radians / 2),
  z: 0,
  w: Math.cos(radians / 2),
});
