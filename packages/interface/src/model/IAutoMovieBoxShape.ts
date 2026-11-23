/** Rectangular box centred at the local origin, before the part transform. */
export interface IAutoMovieBoxShape {
  /** Discriminator. */
  type: "box";

  /** Finite positive full size along local X, metres. */
  width: number;

  /** Finite positive full size along local Y, metres. */
  height: number;

  /** Finite positive full size along local Z, metres. */
  depth: number;
}
