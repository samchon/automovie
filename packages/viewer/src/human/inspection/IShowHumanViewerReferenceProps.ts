import type { HumanViewerAddress } from "./HumanViewerAddress.js";
import type { HumanViewerStage } from "./HumanViewerStage.js";

/**
 * The frame and page elements a reference comparison lays out.
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
