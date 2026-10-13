import type { IHumanViewerReferenceBox } from "./IHumanViewerReferenceBox.js";

/**
 * One layer of the composed capture, drawn in array order.  *
 *
 * @evidence contracts/common.md#principled-implementation Source selection, destination pixels, alpha and optional clip describe one canvas layer in painter order.
 * @evidence contracts/common.md#clear-and-simple-design The layer records layout decisions once so drawing only executes their order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Render and photo are supported composition sources, without per-subject image treatment.
 * @evidence contracts/common.md#meaningful-documentation A null clip exposes the whole destination; alpha is unit-range and box coordinates are capture pixels.
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
