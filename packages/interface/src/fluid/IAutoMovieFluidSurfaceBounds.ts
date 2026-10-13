import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** The world-space box a drawn fluid surface occupies. */
export interface IAutoMovieFluidSurfaceBounds {
  /** Minimum corner. */
  min: IAutoMovieVector3;

  /** Maximum corner. */
  max: IAutoMovieVector3;
}
