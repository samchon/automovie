import type { IHumanViewerLandmark } from "./IHumanViewerLandmark.js";

/**
 * The photograph layer composed with the displayed frame.
 *
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
