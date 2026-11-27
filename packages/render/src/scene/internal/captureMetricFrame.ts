import * as THREE from "three";

import type { AutoMovieRenderSceneLayout } from "../AutoMovieRenderSceneLayout";
import { restoreRenderModeState } from "./restoreRenderModeState";
import { assertMetricRasterBudget } from "./assertMetricRasterBudget";
import { captureFramebufferRestore } from "./captureFramebufferRestore";

/*
 * Capture the caller's current scene through an explicit calibrated camera. The
 * requested dimensions are physical output pixels, independent of the borrowed
 * renderer's device ratio. A silhouette pass uses black meshes on white,
 * separately from neutral-lit surface judgment. The caller selects which scene
 * subjects/construction are visible and redraws its ordinary camera after this
 * operation restores renderer dimensions, framebuffer selection/raster and
 * scene state. Logical and effective physical rectangles remain distinct.
 */
export function captureMetricFrame(
  input: AutoMovieRenderSceneLayout.ICaptureMetricFrameProps,
): string {
  assertMetricRasterBudget(input.width, input.height, input.maxPixels);
  const context: ReturnType<THREE.WebGLRenderer["getContext"]> =
    input.renderer.getContext();
  const maximum: number = context.getParameter(context.MAX_RENDERBUFFER_SIZE);
  if (
    !(maximum > 0 && input.width <= maximum && input.height <= maximum) ||
    context.isContextLost()
  )
    throw new Error("Metric capture exceeds native renderbuffer dimensions");
  const size: THREE.Vector2 = input.renderer.getSize(new THREE.Vector2());
  const ratio: number = input.renderer.getPixelRatio();
  const restoreFramebuffer: () => void = captureFramebufferRestore(
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
    return restoreRenderModeState(restore, { error });
  }
  restoreRenderModeState(restore);
  return png;
}
