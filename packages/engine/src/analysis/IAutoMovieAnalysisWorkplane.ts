import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A rectangular grid of measurement points on one plane.
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
 * @evidence requirements/interior/lighting-daylight-and-optics.md#interior-lighting-analysis-boundary `IAutoMovieAnalysisWorkplane` declares the oriented rectangular grid on which lighting performance is measured.
 * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-lighting-optical-state The workplane supplies a corner, two ordered axes, physical extents, and cell counts for deterministic centre samples.
 */
export interface IAutoMovieAnalysisWorkplane {
  /**
   * World-space corner the grid grows from, in metres.
   *
   * @evidence requirements/interior/lighting-daylight-and-optics.md#interior-lighting-analysis-boundary Workplane `origin` anchors the measured rectangle at an authored world-space corner.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-lighting-optical-state The corner is the base point from which both cell-centre offsets are constructed.
   */
  origin: IAutoMovieVector3;
  /**
   * In-plane direction the first axis runs along; non-zero.
   *
   * @evidence requirements/interior/lighting-daylight-and-optics.md#interior-lighting-analysis-boundary `axisU` declares the first in-plane direction used to place lighting samples.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-lighting-optical-state Its normalized direction spans the U extent and forms the first operand of the measured-face cross product.
   */
  axisU: IAutoMovieVector3;
  /**
   * In-plane direction the second axis runs along; non-zero, not parallel.
   * `cross(axisU, axisV)` is the face light is gathered on.
   *
   * @evidence requirements/interior/lighting-daylight-and-optics.md#interior-lighting-analysis-boundary `axisV` declares the second in-plane direction and therefore which face receives light.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-lighting-optical-state Crossing U with this nonparallel vector produces the sampling normal and spans the V extent.
   */
  axisV: IAutoMovieVector3;
  /**
   * Extent along {@link axisU} in metres; strictly positive.
   *
   * @evidence requirements/interior/lighting-daylight-and-optics.md#interior-lighting-analysis-boundary `sizeU` states the measured workplane's physical reach along its first axis.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-lighting-optical-state The positive metre extent determines each U cell's centre offset and sample spacing.
   */
  sizeU: number;
  /**
   * Extent along {@link axisV} in metres; strictly positive.
   *
   * @evidence requirements/interior/lighting-daylight-and-optics.md#interior-lighting-analysis-boundary `sizeV` bounds the illuminated rectangle along its second authored direction.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-lighting-optical-state This V dimension converts the row index into a world-space centre displacement.
   */
  sizeV: number;
  /**
   * Cells along {@link axisU}; a whole number at or above one.
   *
   * @evidence requirements/interior/lighting-daylight-and-optics.md#interior-lighting-analysis-boundary `countU` declares how many measurement columns resolve the first workplane dimension.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-lighting-optical-state The whole-number column count fixes U sample spacing and contributes to the bounded total sample count.
   */
  countU: number;
  /**
   * Cells along {@link axisV}; a whole number at or above one.
   *
   * @evidence requirements/interior/lighting-daylight-and-optics.md#interior-lighting-analysis-boundary `countV` declares the number of measurement rows across the second workplane dimension.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-lighting-optical-state The row count closes the deterministic grid cardinality and locates every V cell centre.
   */
  countV: number;
}
