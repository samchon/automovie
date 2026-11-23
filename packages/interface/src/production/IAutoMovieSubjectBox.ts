import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Inclusive axis-aligned meter box in the surrounding description's stated
 * coordinate space.
 */
export interface IAutoMovieSubjectBox {
  /** Inclusive minimum corner in metres. */
  min: IAutoMovieVector3;

  /** Inclusive maximum corner in metres. */
  max: IAutoMovieVector3;
}
