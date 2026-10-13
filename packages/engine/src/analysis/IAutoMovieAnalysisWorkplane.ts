import { IAutoMovieVector3 } from "@automovie/interface";

/**
 *
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
 * @evidence contracts/common.md#principled-implementation Samples cell centres at `(i + 0.5) * size / count` along each normalized axis and takes the measured face from the right-handed cross product, so face selection is an authored declaration.
 * @evidence contracts/common.md#clear-and-simple-design Stated in the plane's own axes so every orientation is one shape; the analyzer derives the normal once and every sample shares it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Never infers the measured face from results; the axes are not orthogonalized, so a skewed pair yields a parallelogram grid rather than a refusal.
 * @evidence contracts/common.md#meaningful-documentation States the cell-centre rule, the face convention, axis normalization, the parallelogram case, the metre units and the cell bound.
 * @evidenceExclude contracts/performance.md#cost-and-resources A record; the analyzer's cost scales with `countU * countV` and belongs to the daylight analyzer. Read by one study, whose normal and sky directions the analyzer derives once from it. Three vectors and four numbers owned by the request for one study.
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
