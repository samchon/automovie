import type { AutoMovieVector3Tuple, IAutoMoviePlaneFrame } from "../index";

/**
 * Builds an orthonormal cutting frame whose v follows the projected reference
 * and u cross v = n.
 */

export namespace IAutoMoviePlaneFrameConstruction {
  /**
   * Builds an orthonormal cutting frame whose v follows the projected reference
   * and u cross v = n.
   */

  export type Operation = (
    origin: AutoMovieVector3Tuple,
    normal: AutoMovieVector3Tuple,
    reference: AutoMovieVector3Tuple,
  ) => IAutoMoviePlaneFrame;
}
