import type { IAutoMovieInspectionLabel } from "./IAutoMovieInspectionLabel.js";

/**
 * Greedy label placement result in output pixels.
 * placeAutoMovieInspectionLabels keeps input order, never moves an anchor, and
 * lists overlapping, off-picture or nonvisible-depth anchors in dropped. A
 * dropped projection may have nonfinite pixel coordinates; consumers must not
 * assume it is drawable.
 */
export interface IAutoMovieInspectionLabelPlacement {
  /** Visible nonoverlapping anchors kept in input order. */
  labels: IAutoMovieInspectionLabel[];
  /**
   * Rejected anchors, retaining projected coordinates even when outside the
   * raster or nonfinite.
   */
  dropped: IAutoMovieInspectionLabel[];
}
