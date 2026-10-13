import type * as THREE from "three";

import type { HumanViewerStage } from "./HumanViewerStage.js";
import type { IHumanViewerComposition } from "./IHumanViewerComposition.js";

/**
 * What a capture reads its PNG from.
 *
 * @evidence contracts/common.md#principled-implementation PNG reading finishes the displayed stage and checks that renderer's error state before using its canvas.
 * @evidence contracts/common.md#clear-and-simple-design The stage, renderer and optional photograph composition are explicit inputs to one capture boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A photo comparison stays a distinct composition; its canvas bytes do not establish numerical or anatomical acceptance.
 * @evidence contracts/common.md#meaningful-documentation Identifies the drawn stage, checked renderer, render canvas and nullable photograph overlay.
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
