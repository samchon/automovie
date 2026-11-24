import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/**
 * Public contracts for segment offset scaling.
 */
export namespace IAutoMovieHumanSegmentScaling {
  /**
   * One joint's offset edit: a ratio, or an along/across map in the parent's frame.
   */
  export type IScale = number | ((offset: AutoMovieVector3Tuple) => AutoMovieVector3Tuple);
}
