import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A straight world-space segment awaiting projection.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Carries one world-space segment that becomes a traceable cut or silhouette line on the page.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Defines the endpoint pair passed unchanged from geometric classification into page projection.
 */
export interface IAutoMovieDrawingEdge {
  /**
   * Segment start.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Locates the world-space start of a drawing segment before its page-coordinate projection.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Preserves the first classified intersection or silhouette vertex as the segment's initial endpoint.
   */
  from: IAutoMovieVector3;
  /**
   * Segment end.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Locates the world-space end that completes a cut or silhouette segment on the derived sheet.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Preserves the second classified intersection or outline vertex as the segment's terminal endpoint.
   */
  to: IAutoMovieVector3;
}
