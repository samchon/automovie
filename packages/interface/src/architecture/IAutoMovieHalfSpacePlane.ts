import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** One world-space half-space plane used by a logical volume. */
export interface IAutoMovieHalfSpacePlane {
  /** Non-zero plane normal; it need not be normalized. */
  normal: IAutoMovieVector3;

  /** Finite plane offset in the same scale as the normal. */
  offset: number;
}
