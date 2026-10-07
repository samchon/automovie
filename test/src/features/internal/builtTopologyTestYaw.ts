import type { IAutoMovieQuaternion } from "@automovie/interface";

/** Construct a unit rotation about the world Y axis for the stated angle in radians. */
export const builtTopologyTestYaw = (angle: number): IAutoMovieQuaternion => ({
  x: 0,
  y: Math.sin(angle / 2),
  z: 0,
  w: Math.cos(angle / 2),
});
