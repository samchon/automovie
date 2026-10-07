import type { HumanViewerAddress } from "./HumanViewerAddress";
import type { HumanViewerStage } from "./HumanViewerStage";

/**
 * The frame and page elements a reference comparison lays out.
 *
 * @evidence contracts/common.md#meaningful-documentation Names every member.
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
