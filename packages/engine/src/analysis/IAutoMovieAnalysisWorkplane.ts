import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A grid of measurement points on one plane, rectangular when its two axes are
 * perpendicular.
 *
 * The grid is stated in the plane's own axes rather than in world axes, so a
 * sloped roof light, a tilted desk and a wall panel are all one shape. Samples
 * sit at cell centres, which is what keeps a 1x1 grid a measurement of the
 * middle of the plane instead of a measurement of its corner.
 *
 * A plane has two faces and only one of them is measured: the one the
 * right-handed cross product of {@link axisU} and {@link axisV} points toward.
 * Swapping the two axes, or reversing either, measures the other face, which is
 * the difference between a desk that reads the sky and a desk that reads the
 * floor. The order is a declaration rather than a detail, so it is never
 * inferred from which answer looks brighter.
 *
 * Both axes are normalized before use, so their lengths do not matter, and they
 * are not orthogonalized: two non-perpendicular axes give a parallelogram grid.
 * A grid may hold at most `AUTOMOVIE_ANALYSIS_MAX_SAMPLES` cells.
 *
 * @author Samchon
 */
export interface IAutoMovieAnalysisWorkplane {
  /** World-space corner the grid grows from, in metres; every axis finite. */
  origin: IAutoMovieVector3;

  /** In-plane direction the first axis runs along; finite, non-zero, normalized. */
  axisU: IAutoMovieVector3;

  /**
   * In-plane direction the second axis runs along; finite, non-zero, not
   * parallel to {@link axisU}, normalized before use. `cross(axisU, axisV)` is
   * the face light is gathered on.
   */
  axisV: IAutoMovieVector3;

  /** Extent along {@link axisU} in metres; finite and strictly positive. */
  sizeU: number;

  /** Extent along {@link axisV} in metres; finite and strictly positive. */
  sizeV: number;

  /** Cells along {@link axisU}; a safe integer at or above one. */
  countU: number;

  /** Cells along {@link axisV}; a safe integer at or above one. */
  countV: number;
}
