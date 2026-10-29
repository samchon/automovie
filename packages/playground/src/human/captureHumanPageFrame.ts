import * as THREE from "three";

import type { HumanCaptureCamera } from "./HumanCaptureCamera";
import type { HumanViewerModel } from "./HumanViewerModel";
import type { IHumanViewerPage } from "./IHumanViewerPage";
import { captureHumanViewerFrame } from "./captureHumanViewerFrame";
import { normalizeHumanView } from "./normalizeHumanView";

/**
 * Apply one frame's display conditions and draw it through the single Human page.
 * The page caller restores interactive display and lighting in its finally block, including when selection, framing or readback fails. This helper never generates a model or owns a renderer.
 *
 * @param context The loaded model and borrowed scene resources.
 * @param name Existing named camera.
 * @param pass Existing display pass.
 * @param curves Curve-selection query.
 * @param query Free-view query, including development inspection conditions.
 * @returns The PNG and conditions read from the actual draw.
 *
 * @evidence contracts/common.md#principled-implementation Parses the shared canonical view, applies its display conditions to the actual built model, resolves its camera and captures through captureHumanViewerFrame; records actual visible parts and lighting with the requested material mode.
 * @evidence contracts/common.md#clear-and-simple-design Extracts only frame application and metadata from the page; lifecycle admission and interactive restoration remain with its caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Preserves camera names, passes, geometry and bounds; clay and raking are explicit inspection conditions rather than anatomical or parameter corrections.
 * @evidence contracts/common.md#meaningful-documentation States ownership, the required caller finally restoration, canonical queries and actual-draw provenance.
 * @evidence contracts/performance.md#efficient-algorithms A bounded number of model restyles, one camera placement, one draw and one PNG encode; metadata copies only the visible-part and selection lists.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the page's loaded model, renderer, lights and shot cameras and forwards canonical view text for existing frame identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows scene resources for the call, retains no state and returns only caller-owned PNG and metadata; derived materials are retired by the caller's display restoration.
 */
export function captureHumanPageFrame(
  context: captureHumanPageFrame.Context,
  name: string,
  pass: IHumanViewerPage.Pass,
  curves: string,
  query: string,
): IHumanViewerPage.ICapture {
  const view: ReturnType<typeof normalizeHumanView> = normalizeHumanView(
    (variable: string): string | null =>
      new URLSearchParams(query).get(variable),
  );
  const model: HumanViewerModel = context.model;
  model.setPass(pass);
  const selection: IHumanViewerPage.ISelection = model.setCurves(curves);
  model.setIsolate(view.value.isolate);
  model.setDisplay(view.value);
  const visibleParts: string[] = model.setPass(pass);
  const descriptor: HumanCaptureCamera.IDescriptor = model.describe(
    name,
    view.value,
  );
  const drawn: ReturnType<typeof captureHumanViewerFrame> =
    captureHumanViewerFrame(
      context.renderer,
      context.scene,
      descriptor.orthographic === true
        ? context.shots.orthographic
        : context.shots.perspective,
      context.key,
      descriptor,
      model.bounds,
      view.value.isolate ? [] : selection.selected.map(
        (id: string, index: number): { id: string; colour: string } => ({
          id,
          colour: selection.colours[index]!,
        }),
      ),
      context.hemisphere,
      view.value.light,
    );
  return {
    png: drawn.png,
    capturedUtc: drawn.capturedUtc,
    metadata: {
      generation: model.loaded.generation,
      alias: model.loaded.alias,
      pass,
      view: view.text,
      inspection: {
        hair: view.value.hair,
        garment: view.value.garment,
        material: view.value.material,
        light: view.value.light,
      },
      curves: selection,
      visibleParts,
      camera: drawn.placement,
      bounds: model.loaded.bounds,
      canvas: drawn.canvas,
      background:
        "#" +
        new THREE.Color(context.scene.background as THREE.Color).getHexString(),
      hemisphere: {
        sky: "#" + context.hemisphere.color.getHexString(),
        ground: "#" + context.hemisphere.groundColor.getHexString(),
        intensity: context.hemisphere.intensity,
      },
      renderer: drawn.renderer,
    },
  };
}

/**
 * Borrowed inputs for one frame; the page owns every scene resource.
 *
 * @evidence contracts/common.md#principled-implementation Context types name the actual loaded model and three.js objects used by the draw.
 * @evidence contracts/common.md#clear-and-simple-design Keeps the frame helper's borrowed resources beside its declaration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no alternate model, viewer, source mesh or per-person controls.
 * @evidence contracts/common.md#meaningful-documentation States resource ownership and each context member's role.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A type namespace chooses no processing algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A type namespace owns no effects or cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A type namespace owns no runtime resources.
 */
export namespace captureHumanPageFrame {
  /**
   * Resources borrowed from the single Human page for the duration of a draw.
   */
  export interface Context {
    /** Loaded model whose skin and construction are displayed. */
    model: HumanViewerModel;

    /** Page renderer with preserved drawing buffer. */
    renderer: THREE.WebGLRenderer;

    /** Page scene holding the model and lights. */
    scene: THREE.Scene;

    /** Page directional light. */
    key: THREE.DirectionalLight;

    /** Page hemisphere light. */
    hemisphere: THREE.HemisphereLight;

    /** Page-owned capture cameras; no second renderer is created. */
    shots: {
      perspective: THREE.PerspectiveCamera;
      orthographic: THREE.OrthographicCamera;
    };
  }
}
