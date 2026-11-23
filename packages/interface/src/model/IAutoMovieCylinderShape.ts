/** Closed cylinder along local Y, with its midpoint at the local origin. */
export interface IAutoMovieCylinderShape {
  /** Discriminator. */
  type: "cylinder";

  /** Finite positive radius of both ends, metres. */
  radius: number;

  /** Finite positive full height along local Y, metres. */
  height: number;
}
