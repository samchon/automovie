import type { IHumanViewerReferenceBox } from "./IHumanViewerReferenceBox.js";

/**
 * One layer of the composed capture, drawn in array order.
 *
 * @evidence contracts/common.md#principled-implementation Ordered render/photo layers express split, overlay and swipe composition through a destination box, opacity and optional clip rectangle.
 * @evidence contracts/common.md#clear-and-simple-design A single layer record serves canvas capture and shared layout without carrying filenames or numerical document state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The render/photo union selects actual composition sources; no photograph-specific correction or hidden subject placement is encoded.
 * @evidence contracts/common.md#meaningful-documentation Documentation gives array-order drawing, already-fitted destinations, unit-range alpha and null meaning an unclipped destination.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Layer metadata chooses no raster algorithm; drawHumanViewerReference submits its boxes to the borrowed canvas.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A layer describes one composition and carries no identity cache that could reuse stale photograph pixels.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The source discriminator owns no image object; decoded photograph and render canvas remain owned by the drawing caller.
 *
 * @author Samchon
 */
export interface IHumanViewerReferenceLayer {
  /** The rendered viewport, or the local reference photograph. */
  source: "render" | "photo";

  /** Destination rectangle, with the photograph already fitted. */
  box: IHumanViewerReferenceBox;

  /** Opacity of this layer, between zero and one. */
  alpha: number;

  /** Visible window inside the destination, or null for all of it. */
  clip: IHumanViewerReferenceBox | null;
}
