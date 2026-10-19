import * as THREE from "three";

import { restoreAutoMovieRenderModeState } from "./restoreAutoMovieRenderModeState.js";

/**
 * Capture the caller's current scene through an explicit calibrated camera.
 * The requested dimensions are physical output pixels, independent of the
 * borrowed renderer's device ratio. A silhouette pass uses black meshes on
 * white, separately from neutral-lit surface judgment. The caller selects which
 * scene subjects/construction are visible and redraws its ordinary camera after
 * this operation restores renderer dimensions and scene state.
 *
 * @evidence contracts/common.md#principled-implementation One original native render uses the supplied camera and current scene geometry; physical pixel dimensions and an explicit optional silhouette material define the capture without changing any model coefficients or camera matrix.
 * @evidence contracts/common.md#clear-and-simple-design This viewer operation owns temporary capture state and PNG extraction while the caller retains renderer, scene, camera and loaded subject ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No capture-only model, source image overlay, extra reconstruction, software renderer, native method replacement or silent resolution downgrade supplies pixels.
 * @evidence contracts/common.md#meaningful-documentation States physical pixel sizing, borrowed resources, surface versus structural silhouette meaning, restored states and caller redraw responsibility.
 * @evidence contracts/performance.md#efficient-algorithms One render and PNG encoding scale with admitted W times H pixels and visible scene geometry; maxPixels bounds output raster allocation before resizing and no persistent render target is retained.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each capture observes current mutable scene/camera state and has a distinct pixel effect, so it is not cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrowed dimensions, pixel ratio, background and override material are restored independently after success or failure; the one optional owned mask material is disposed and only PNG data transfers. Public disposal does not certify GPU-driver retirement.
 */
export function captureAutoMovieMetricFrame(input: {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.Camera;
  width: number;
  height: number;
  maxPixels: number;
  mode: "surface" | "silhouette";
}): string {
  if (
    !input ||
    !Number.isSafeInteger(input.width) ||
    input.width < 1 ||
    !Number.isSafeInteger(input.height) ||
    input.height < 1 ||
    !Number.isSafeInteger(input.maxPixels) ||
    input.maxPixels < 1 ||
    !Number.isSafeInteger(input.width * input.height) ||
    input.width * input.height > input.maxPixels ||
    !["surface", "silhouette"].includes(input.mode)
  )
    throw new Error(
      "Metric capture requires positive bounded physical pixel dimensions and an explicit pass",
    );
  const maximum: number = input.renderer
    .getContext()
    .getParameter(input.renderer.getContext().MAX_RENDERBUFFER_SIZE) as number;
  if (!Number.isSafeInteger(maximum) || maximum <= 0 || input.renderer.getContext().isContextLost() || input.width > maximum || input.height > maximum)
    throw new Error("Metric capture exceeds native renderbuffer dimensions");
  const size: THREE.Vector2 = input.renderer.getSize(new THREE.Vector2());
  const ratio: number = input.renderer.getPixelRatio();
  const target: THREE.WebGLRenderTarget | null =
    input.renderer.getRenderTarget();
  const viewport: THREE.Vector4 = input.renderer.getViewport(
    new THREE.Vector4(),
  );
  const scissor: THREE.Vector4 = input.renderer.getScissor(new THREE.Vector4());
  const scissorTest: boolean = input.renderer.getScissorTest();
  const autoClear: boolean = input.renderer.autoClear;
  const background: THREE.Scene["background"] = input.scene.background;
  const override: THREE.Scene["overrideMaterial"] =
    input.scene.overrideMaterial;
  const mask: THREE.MeshBasicMaterial | null =
    input.mode === "silhouette"
      ? new THREE.MeshBasicMaterial({ color: 0x000000 })
      : null;
  const restore: (() => void)[] = [
    (): void => {
      input.scene.background = background;
      input.scene.overrideMaterial = override;
    },
    (): void => {
      input.renderer.setPixelRatio(ratio);
      input.renderer.setSize(size.x, size.y, false);
    },
    (): void => {
      input.renderer.setRenderTarget(target);
      input.renderer.setViewport(viewport);
      input.renderer.setScissor(scissor);
      input.renderer.setScissorTest(scissorTest);
      input.renderer.autoClear = autoClear;
    },
    (): void => {
      mask?.dispose();
    },
  ];
  let png: string;
  try {
    if (mask) {
      input.scene.background = new THREE.Color(0xffffff);
      input.scene.overrideMaterial = mask;
    }
    input.renderer.setRenderTarget(null);
    input.renderer.setPixelRatio(1);
    input.renderer.setSize(input.width, input.height, false);
    input.renderer.setViewport(0, 0, input.width, input.height);
    input.renderer.setScissorTest(false);
    input.renderer.autoClear = true;
    input.renderer.render(input.scene, input.camera);
    png = input.renderer.domElement.toDataURL("image/png");
  } catch (error: unknown) {
    return restoreAutoMovieRenderModeState(restore, { error });
  }
  restoreAutoMovieRenderModeState(restore);
  return png;
}
