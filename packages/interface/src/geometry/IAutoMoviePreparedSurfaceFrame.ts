import type { IAutoMovieSurfaceFrame } from "./IAutoMovieSurfaceFrame";
import type { IAutoMovieVector3 } from "./IAutoMovieVector3";

/**
 * Centroid-based source frame and three read-only local offsets for one rigid
 * triangle.
 *
 * Preparation accepts three finite noncollinear metre points. The first edge
 * supplies heading and the oriented edge cross product supplies normal, with an
 * optional reference choosing its sign. Treat the returned offsets as read-only
 * and use them as a unit.
 */
export interface IAutoMoviePreparedSurfaceFrame {
  /**
   * Owned source centroid and unit heading and normal. The source basis
   * supports a rigid round trip in the same metre frame.
   */
  readonly frame: IAutoMovieSurfaceFrame;

  /**
   * Three owned centroid-relative offsets in original point order, in metres
   * along forward, normal cross forward and normal.
   *
   * Supply the prepared finite offsets to the placement operation. A
   * destination basis reconstructs coordinates without resizing the source
   * sample.
   */
  readonly offsets: readonly [
    Readonly<IAutoMovieVector3>,
    Readonly<IAutoMovieVector3>,
    Readonly<IAutoMovieVector3>,
  ];
}
