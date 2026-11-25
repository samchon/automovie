/** Flat rectangle centred at the origin in the local XZ plane, with zero height. */
export interface IAutoMoviePlaneShape {
  /** Discriminator. */
  type: "plane";

  /** Finite positive full size along local X, metres. */
  width: number;

  /** Finite positive full size along local Z, metres. */
  depth: number;
}
