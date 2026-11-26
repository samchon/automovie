import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/**
 * Type contracts exchanged by AutoMovieHumanF1Joints; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanF1Joints {
  /**
   * The segments argument of AutoMovieHumanF1Joints.toward. The point `length`
   * millimetres past `from` along the mean of the unit directions of
   * `segments`: where a limb's course runs on past its knuckles toward its
   * digits.
   */
  export type TowardSegments = [AutoMovieVector3Tuple, AutoMovieVector3Tuple][];
}
