import * as THREE from "three";

import { assertAutoMovieMetricRasterBudget } from "./assertAutoMovieMetricRasterBudget.js";
import { captureAutoMovieFramebufferRestore } from "./captureAutoMovieFramebufferRestore.js";
import { restoreAutoMovieRenderModeState } from "./restoreAutoMovieRenderModeState.js";

/**
 * Capture the caller's current scene through an explicit calibrated camera. The
 * requested dimensions are physical output pixels, independent of the borrowed
 * renderer's device ratio. A silhouette pass uses black meshes on white,
 * separately from neutral-lit surface judgment. The caller selects which scene
 * subjects/construction are visible and redraws its ordinary camera after this
 * operation restores renderer dimensions, framebuffer selection/raster and
 * scene state. Logical and effective physical rectangles remain distinct.
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
  assertAutoMovieMetricRasterBudget(input.width, input.height, input.maxPixels);
  const maximum: number = input.renderer
    .getContext()
    .getParameter(input.renderer.getContext().MAX_RENDERBUFFER_SIZE);
  if (
    !(maximum > 0 && input.width <= maximum && input.height <= maximum) ||
    input.renderer.getContext().isContextLost()
  )
    throw new Error("Metric capture exceeds native renderbuffer dimensions");
  const size: THREE.Vector2 = input.renderer.getSize(new THREE.Vector2());
  const ratio: number = input.renderer.getPixelRatio();
  const restoreFramebuffer: () => void = captureAutoMovieFramebufferRestore(
    input.renderer,
  );
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
    },
    (): void => {
      input.scene.overrideMaterial = override;
    },
    (): void => {
      input.renderer.setPixelRatio(ratio);
    },
    (): void => {
      input.renderer.setSize(size.x, size.y, false);
    },
    restoreFramebuffer,
    (): void => {
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
