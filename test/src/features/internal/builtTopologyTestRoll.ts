import type { IAutoMovieQuaternion } from "@automovie/interface";


/** Construct a unit rotation about the world Z axis for the stated angle in radians. */
export const builtTopologyTestRoll = (angle: number): IAutoMovieQuaternion => ({
  x: 0,
  y: 0,
  z: Math.sin(angle / 2),
  w: Math.cos(angle / 2),
});
