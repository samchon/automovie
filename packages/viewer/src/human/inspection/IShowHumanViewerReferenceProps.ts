import type { HumanViewerAddress } from "./HumanViewerAddress.js";
import type { HumanViewerStage } from "./HumanViewerStage.js";

/**
 * The frame and page elements a reference comparison lays out.
 *
 * @evidence contracts/common.md#principled-implementation Reference layout receives the displayed address and stage beside separate render, photograph and landmark DOM elements.
 * @evidence contracts/common.md#clear-and-simple-design The compositor borrows page elements and retains no authoring document or numerical geometry state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A displayed photograph and landmark overlay remain comparison layers rather than replacement anatomical output.
 * @evidence contracts/common.md#meaningful-documentation Identifies the frame container, render canvas, photograph and SVG overlay associated with the shown address.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-review Reference layout receives the displayed address and stage beside separate render, photograph and landmark DOM elements.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review The compositor borrows page elements and retains no authoring document or numerical geometry state.
 * @author Samchon
 */
export interface IShowHumanViewerReferenceProps {
  /**
   * The address being shown.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-review The address being shown. Reference layout receives the displayed address and stage beside separate render, photograph and landmark DOM elements.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review The address being shown. The compositor borrows page elements and retains no authoring document or numerical geometry state.
   */
  address: HumanViewerAddress;

  /**
   * The stage that drew it.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor The stage that drew it. Reference layout receives the displayed address and stage beside separate render, photograph and landmark DOM elements.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view The stage that drew it. The compositor borrows page elements and retains no authoring document or numerical geometry state.
   */
  stage: HumanViewerStage;

  /**
   * The frame element holding canvas and photograph.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-review The frame element holding canvas and photograph. Reference layout receives the displayed address and stage beside separate render, photograph and landmark DOM elements.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review The frame element holding canvas and photograph. The compositor borrows page elements and retains no authoring document or numerical geometry state.
   */
  display: HTMLDivElement;

  /**
   * The render canvas.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-review The render canvas. Reference layout receives the displayed address and stage beside separate render, photograph and landmark DOM elements.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review The render canvas. The compositor borrows page elements and retains no authoring document or numerical geometry state.
   */
  canvas: HTMLCanvasElement;

  /**
   * The photograph layer.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-provenance The photograph layer. Reference layout receives the displayed address and stage beside separate render, photograph and landmark DOM elements.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-provenance The photograph layer. The compositor borrows page elements and retains no authoring document or numerical geometry state.
   */
  reference: HTMLImageElement;

  /**
   * The landmark overlay.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-review The landmark overlay. Reference layout receives the displayed address and stage beside separate render, photograph and landmark DOM elements.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review The landmark overlay. The compositor borrows page elements and retains no authoring document or numerical geometry state.
   */
  landmarks: SVGSVGElement;
}
