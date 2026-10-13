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
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-review PNG reading finishes the displayed stage and checks that renderer's error state before using its canvas.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review The stage, renderer and optional photograph composition are explicit inputs to one capture boundary.
 * @author Samchon
 */
export interface IReadHumanViewerPngProps {
  /**
   * The stage on screen, finished before reading.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor The stage on screen, finished before reading. PNG reading finishes the displayed stage and checks that renderer's error state before using its canvas.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view The stage on screen, finished before reading. The stage, renderer and optional photograph composition are explicit inputs to one capture boundary.
   */
  stage: HumanViewerStage;

  /**
   * The page's WebGL renderer, whose error state is checked.
   *
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-runtime-identity The page's WebGL renderer, whose error state is checked. PNG reading finishes the displayed stage and checks that renderer's error state before using its canvas.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-capture-runtime-identity The page's WebGL renderer, whose error state is checked. The stage, renderer and optional photograph composition are explicit inputs to one capture boundary.
   */
  renderer: THREE.WebGLRenderer;

  /**
   * The render canvas.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-review The render canvas. PNG reading finishes the displayed stage and checks that renderer's error state before using its canvas.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review The render canvas. The stage, renderer and optional photograph composition are explicit inputs to one capture boundary.
   */
  canvas: HTMLCanvasElement;

  /**
   * The photograph layer of the frame, or null while none is shown.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-review The photograph layer of the frame, or null while none is shown. PNG reading finishes the displayed stage and checks that renderer's error state before using its canvas.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review The photograph layer of the frame, or null while none is shown. The stage, renderer and optional photograph composition are explicit inputs to one capture boundary.
   */
  composition: IHumanViewerComposition | null;

  /**
   * The photograph element.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-provenance The photograph element. PNG reading finishes the displayed stage and checks that renderer's error state before using its canvas.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-provenance The photograph element. The stage, renderer and optional photograph composition are explicit inputs to one capture boundary.
   */
  photo: HTMLImageElement;
}
