import type { IHumanViewerLandmark } from "./IHumanViewerLandmark";

/**
 * The photograph layer composed with the displayed frame.
 *
 * @evidence contracts/common.md#meaningful-documentation Names what the capture composes over the render.
 * @author Samchon
 */
export interface IHumanViewerComposition {
  /** How the photograph meets the render. */
  mode: "split" | "overlay" | "swipe";

  /** Overlay opacity or swipe position, 0 to 1. */
  opacity: number;

  /** Frame size in pixels. */
  size: number;

  /** Landmarks drawn over the photograph, empty when off. */
  landmarks: IHumanViewerLandmark[];
}
