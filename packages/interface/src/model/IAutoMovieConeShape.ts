/** Cone aligned to local Y: base at `+height / 2`, apex at `-height / 2`. */
export interface IAutoMovieConeShape {
  /** Discriminator. */
  type: "cone";

  /** Finite positive base radius, metres. */
  radius: number;

  /** Finite positive full height along local Y, metres. */
  height: number;
}
