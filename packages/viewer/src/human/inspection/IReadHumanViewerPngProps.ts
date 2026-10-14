import type * as THREE from "three";

import type { HumanViewerStage } from "./HumanViewerStage.js";
import type { IHumanViewerComposition } from "./IHumanViewerComposition.js";

/**
 * What a capture reads its PNG from.
 *
 * @evidence contracts/common.md#principled-implementation PNG readback combines the finished on-screen stage, its actual renderer and optional reference composition so capture reproduces the displayed frame.
 * @evidence contracts/common.md#clear-and-simple-design GPU canvas and photograph remain separate inputs until the capture composition draws their shared layout.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The capture reads the actual current render and photograph rather than substituting a stored expected picture or ignoring renderer errors.
 * @evidence contracts/common.md#meaningful-documentation Member comments document finished-stage ordering, renderer error checking and null meaning no photograph layer is shown.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The PNG-input declaration chooses no framebuffer readback, image encoding or layer-layout algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A mutable on-screen frame cannot be reused solely from canvas identity; completion and source authority are checked by capture ownership.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns stage, WebGL renderer, canvas and image element; readback borrows them and owns only its returned PNG data.
 *
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
