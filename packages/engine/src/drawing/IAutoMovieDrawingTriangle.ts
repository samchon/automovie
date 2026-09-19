import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One world-space triangle of some element's geometry.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Carries one exact world-space surface primitive from which the drawing derives section and silhouette linework.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Represents a consistently wound three-corner facet consumed by the deterministic projection kernel.
 */
export interface IAutoMovieDrawingTriangle {
  /**
   * First corner.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Supplies the first world-space corner that anchors a source facet's projected and cut geometry.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Establishes the origin corner used with `b` and `c` to classify the facet's plane and winding.
   */
  a: IAutoMovieVector3;
  /**
   * Second corner.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Supplies the second world-space corner that fixes the facet's first edge for line extraction.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Forms the first directed span from `a` used in the facet normal and plane-intersection calculations.
   */
  b: IAutoMovieVector3;
  /**
   * Third corner.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Supplies the third world-space corner that closes the facet projected onto the drawing.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Forms the second span from `a`, completing the facet normal, winding, and clipping domain.
   */
  c: IAutoMovieVector3;
}
