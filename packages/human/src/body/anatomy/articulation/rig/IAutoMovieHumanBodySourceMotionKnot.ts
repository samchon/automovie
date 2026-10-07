/** One source-authored mapping from a driver coordinate to a joint coordinate. */
export interface IAutoMovieHumanBodySourceMotionKnot {
  /** Input coordinate in the driver's declared unit, strictly increasing across a profile. */
  input: number;

  /** Output coordinate in the source joint axis's declared unit. */
  output: number;
}
