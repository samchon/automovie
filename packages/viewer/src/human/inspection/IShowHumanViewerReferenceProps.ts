import type { HumanViewerAddress } from "./HumanViewerAddress.js";
import type { HumanViewerStage } from "./HumanViewerStage.js";

/**
 * The frame and page elements a reference comparison lays out.
 *
 * @evidence contracts/common.md#principled-implementation Display comparison receives the selected address, actual stage, canvas, photograph and SVG overlay that together form the shown frame.
 * @evidence contracts/common.md#clear-and-simple-design Explicit borrowed DOM elements let one reference operation coordinate layout without owning mounting or numerical construction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The operation compares the real supplied display and local photograph rather than rendering a canned reference model for selected documents.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish the stage, containing frame, GPU canvas, photograph layer and observed-landmark overlay.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This display-input shape selects no photograph fit, landmark placement or camera transformation algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Borrowed mutable page elements do not establish equivalence of reference metadata or frame contents across address changes.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Mounting owns all supplied DOM elements and the stage; reference layout borrows them without taking worker or GPU disposal ownership.
 *
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
