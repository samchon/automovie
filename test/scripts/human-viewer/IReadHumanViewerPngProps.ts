import type * as THREE from "three";

import type { HumanViewerStage } from "./HumanViewerStage";
import type { IHumanViewerComposition } from "./IHumanViewerComposition";

/**
 * What a capture reads its PNG from.
 *
 * @evidence contracts/common.md#meaningful-documentation Names every member.
 * @author Samchon
 */
export interface IReadHumanViewerPngProps {
  /** The stage on screen, finished before reading. */
  stage: HumanViewerStage;

  /** The page's WebGL renderer, whose error state is checked. */
  renderer: THREE.WebGLRenderer;

  /** The render canvas. */
  canvas: HTMLCanvasElement;

  /** The photograph layer of the frame, or null while none is shown. */
  composition: IHumanViewerComposition | null;

  /** The photograph element. */
  photo: HTMLImageElement;
}
