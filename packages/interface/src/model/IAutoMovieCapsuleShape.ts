/**
 * Capsule aligned to local Y, centred on its cylindrical body's midpoint. Total
 * height is `height + 2 * radius`; height excludes both hemispheres.
 */
export interface IAutoMovieCapsuleShape {
  /** Discriminator. */
  type: "capsule";

  /** Finite positive radius of the body and end caps, metres. */
  radius: number;

  /** Finite positive cylindrical length between the caps, metres. */
  height: number;
}
