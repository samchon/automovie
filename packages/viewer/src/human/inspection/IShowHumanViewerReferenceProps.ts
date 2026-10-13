import type { HumanViewerAddress } from "./HumanViewerAddress.js";
import type { HumanViewerStage } from "./HumanViewerStage.js";

/**
 * The frame and page elements a reference comparison lays out.
 *
 * @evidence contracts/common.md#principled-implementation Reference layout receives the displayed address and stage beside separate render, photograph and landmark DOM elements.
 * @evidence contracts/common.md#clear-and-simple-design The compositor borrows page elements and retains no authoring document or numerical geometry state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A displayed photograph and landmark overlay remain comparison layers rather than replacement anatomical output.
 * @evidence contracts/common.md#meaningful-documentation Identifies the frame container, render canvas, photograph and SVG overlay associated with the shown address.
 * @author Samchon
 */
export interface IShowHumanViewerReferenceProps {
  /** The address being shown. */
  address: HumanViewerAddress;

  /** The stage that drew it. */
  stage: HumanViewerStage;

  /** The frame element holding canvas and photograph. */
  display: HTMLDivElement;

  /** The render canvas. */
  canvas: HTMLCanvasElement;

  /** The photograph layer. */
  reference: HTMLImageElement;

  /** The landmark overlay. */
  landmarks: SVGSVGElement;
}
