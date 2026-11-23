import type { IAutoMovieSurfaceFrame } from "./IAutoMovieSurfaceFrame";
import type { IAutoMovieVector3 } from "./IAutoMovieVector3";

/**
 * Three rigid sample points prepared by prepareAutoMovieSurfaceFrame. All
 * records and the offset tuple are frozen. Offsets are centroid-relative metres
 * along forward, normal-cross-forward, and normal, respectively. Their order is
 * the original point order; placement never refits their lengths.
 */
export interface IAutoMoviePreparedSurfaceFrame {
  /** Frozen centroid and unit source directions, useful for a round trip. */
  readonly frame: IAutoMovieSurfaceFrame;

  /** Frozen original-order point coordinates in the orthonormal source basis. */
  readonly offsets: readonly [
    Readonly<IAutoMovieVector3>,
    Readonly<IAutoMovieVector3>,
    Readonly<IAutoMovieVector3>,
  ];
}
