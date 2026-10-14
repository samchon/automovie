import type { IHumanViewerLandmark } from "./IHumanViewerLandmark.js";

/**
 * The photograph layer composed with the displayed frame.
 *
 * @evidence contracts/common.md#principled-implementation Records the selected split/overlay/swipe photo composition so DOM display and PNG reproduction use matching layout and landmarks.
 * @evidence contracts/common.md#clear-and-simple-design Keeps local reference presentation separate from numerical Human document/basis/cache identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Photographs guide comparison and provide no hidden-tissue measurements; metadata/decode refusal must not silently omit a requested reference.
 * @evidence contracts/common.md#meaningful-documentation States pixel size, render-opacity/swipe fraction and marker list; input planning admits layout values, while later decode can leave partial DOM changes.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record draws no pixels; image decode/composition cost scales with frame pixels and landmark drawing with marker count.
 * @evidence contracts/performance.md#reuse-equivalent-work Current reference metadata/bytes can change independently of numerical source, so showHumanViewerReference rereads them rather than assuming model-key equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The display/PNG owner borrows composition and marker arrays; decoded image/DOM ownership remains in the page, with no photo bytes cached numerically.
 *
 * @author Samchon
 */
export interface IHumanViewerComposition {
  /** How the photograph meets the render. */
  mode: "split" | "overlay" | "swipe";

  /** Render share in overlay mode or swipe position, 0 to 1. */
  opacity: number;

  /** Frame size in pixels. */
  size: number;

  /** Landmarks drawn over the photograph, empty when off. */
  landmarks: IHumanViewerLandmark[];
}
