/** Axis-aligned rectangular box. */
export interface IAutoMovieBoxShape {
  /** Discriminator. */
  type: "box";

  /** Full size along local X, meters. */
  width: number;

  /** Full size along local Y, meters. */
  height: number;

  /** Full size along local Z, meters. */
  depth: number;
}
