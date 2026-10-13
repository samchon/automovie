import type { IHumanViewerLandmark } from "./IHumanViewerLandmark.js";

/**
 * The photograph layer composed with the displayed frame.
 *
 * @evidence contracts/common.md#meaningful-documentation Names what the capture composes over the render.
 *
 * @evidence contracts/common.md#principled-implementation Composition mode, unit-range opacity, pixel extent and observed landmarks specify the 2D photograph layer independently of numerical geometry.
 * @evidence contracts/common.md#clear-and-simple-design Only display-layer choices are present, with landmarks grouped in their shared image convention.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reference composition cannot enter model construction or numerical cache identity through these fields.
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
