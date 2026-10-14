import { IAutoMovieQuaternion } from "@automovie/interface";

/** Encode the existing stair fixture's radian angle as a positive-Y quaternion using sine/cosine of its half-angle, without normalizing or admitting the input. */
export const yaw: (radians: number) => IAutoMovieQuaternion = (radians: number): IAutoMovieQuaternion => ({
  x: 0,
  y: Math.sin(radians / 2),
  z: 0,
  w: Math.cos(radians / 2),
});
