import type { IHumanViewerReferenceBox } from "./IHumanViewerReferenceBox.js";

/**
 * One layer of the composed capture, drawn in array order.  *
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
