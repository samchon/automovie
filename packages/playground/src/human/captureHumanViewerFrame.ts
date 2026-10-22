import * as THREE from "three";

import { HumanCaptureCamera } from "./HumanCaptureCamera";

/**
 * Draw one named camera at the reference capture conditions and read the PNG back.
 *
 * The drawing buffer is set to 1200 x 1200 at pixel ratio 1, the shot camera
 * is placed by {@link HumanCaptureCamera.place}, and the PNG is read with
 * `toDataURL` right after the draw; the renderer was created with
 * `preserveDrawingBuffer`, so the read sees the drawn pixels. The caller owns
 * restoring its interactive size, which this function leaves at 1200 x 1200.
 *
 * @param renderer Renderer of the page's canvas.
 * @param scene Scene with the model, already set to the wanted pass and selection.
 * @param shot Camera used only for captures; its aspect is set to 1.
 * @param key Key light, moved to the shot's camera-relative position.
 * @param camera Camera name.
 * @param bounds Whole surface bounds in metres.
 * @returns PNG data URL, capture time, placement, canvas facts and the WebGL renderer strings.
 *
 * @evidence contracts/common.md#principled-implementation Pins the drawing buffer and pixel ratio, places the shot camera with the reference framing rule, draws once and reads the preserved buffer, then checks the canvas reached 1200 x 1200.
 * @evidence contracts/common.md#clear-and-simple-design One function owns the readback conditions; pass, selection and restoring the interactive view stay with the page.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A wrong canvas size throws instead of returning a mis-sized PNG; renderer strings are read from the context, never assumed.
 * @evidence contracts/common.md#meaningful-documentation States the conditions, the preserveDrawingBuffer premise and what the caller must restore.
 * @evidence contracts/performance.md#efficient-algorithms One draw of the scene plus one PNG encode of 1200 x 1200 pixels in the browser.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the page's renderer, scene, lights and shot camera.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one data URL string owned by the caller; the drawing buffer stays the renderer's.
 */
export function captureHumanViewerFrame(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  shot: THREE.PerspectiveCamera,
  key: THREE.DirectionalLight,
  camera: string,
  bounds: THREE.Box3,
): {
  png: string;
  capturedUtc: string;
  placement: HumanCaptureCamera.IPlacement;
  canvas: { width: number; height: number; pixelRatio: number };
  renderer: { vendor: string; renderer: string };
} {
  const descriptor: HumanCaptureCamera.IDescriptor = HumanCaptureCamera.describe(
    camera,
    bounds,
  );
  renderer.setPixelRatio(1);
  renderer.setSize(HumanCaptureCamera.size, HumanCaptureCamera.size, false);
  shot.aspect = 1;
  const placement: HumanCaptureCamera.IPlacement = HumanCaptureCamera.place(
    shot,
    key,
    descriptor,
    bounds,
  );
  renderer.render(scene, shot);
  const capturedUtc: string = new Date().toISOString();
  const png: string = renderer.domElement.toDataURL("image/png");

  const canvas: { width: number; height: number; pixelRatio: number } = {
    width: renderer.domElement.width,
    height: renderer.domElement.height,
    pixelRatio: renderer.getPixelRatio(),
  };
  if (
    canvas.width !== HumanCaptureCamera.size ||
    canvas.height !== HumanCaptureCamera.size
  )
    throw new Error("Human capture canvas did not reach 1200 x 1200");

  // Unmasked strings name the GPU; the masked ones are the fallback.
  const gl: WebGLRenderingContext | WebGL2RenderingContext =
    renderer.getContext();
  const info: WEBGL_debug_renderer_info | null = gl.getExtension(
    "WEBGL_debug_renderer_info",
  );
  return {
    png,
    capturedUtc,
    placement,
    canvas,
    renderer: {
      vendor: String(
        gl.getParameter(info === null ? gl.VENDOR : info.UNMASKED_VENDOR_WEBGL),
      ),
      renderer: String(
        gl.getParameter(
          info === null ? gl.RENDERER : info.UNMASKED_RENDERER_WEBGL,
        ),
      ),
    },
  };
}
