import * as THREE from "three";

import { HumanCaptureCamera } from "./HumanCaptureCamera";
import { applyHumanInspectionLighting } from "./applyHumanInspectionLighting";
import type { normalizeHumanView } from "./normalizeHumanView";

/**
 * Draw one named camera with the requested display and inspection conditions and read the PNG back.
 *
 * The drawing buffer is set to 1200 x 1200 at pixel ratio 1, the shot camera
 * is placed by {@link HumanCaptureCamera.place}, and the PNG is read with
 * `toDataURL` right after the draw; the renderer was created with
 * `preserveDrawingBuffer`, so the read sees the drawn pixels. The caller owns
 * restoring its interactive size, which this function leaves at 1200 x 1200.
 * A frame with a curve selection carries a legend box listing each curve id
 * in its colour. Reference comparison requires the matching named camera and
 * surface pass, empty selection, no free-view overrides, default hair and
 * garment visibility, generated appearance and reference lighting.
 *
 * @param renderer Renderer of the page's canvas.
 * @param scene Scene with the model, already set to the wanted pass and selection.
 * @param shot Capture-only camera of the projection the descriptor selects; placed at aspect 1.
 * @param key Key light, moved to the shot's camera-relative position.
 * @param descriptor Camera direction and region from `HumanCaptureCamera.describe`.
 * @param bounds Whole surface bounds in metres.
 * @param legend Selected curves and their colours; non-empty draws a legend box at the top left of the PNG.
 * @param hemisphere Existing ambient light; changed only by the inspection profile.
 * @param light Reference or raking inspection profile, recorded through the actual placement and ambient values.
 * @returns PNG data URL, capture time, placement, canvas facts and the WebGL renderer strings.
 *
 * @evidence contracts/common.md#principled-implementation Pins the drawing buffer and pixel ratio, places the shot camera with the reference framing rule, applies the shared inspection-light profile, draws once and reads the preserved buffer, then checks the canvas reached 1200 x 1200.
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
  shot: THREE.PerspectiveCamera | THREE.OrthographicCamera,
  key: THREE.DirectionalLight,
  descriptor: HumanCaptureCamera.IDescriptor,
  bounds: THREE.Box3,
  legend: ReadonlyArray<{ id: string; colour: string }>,
  hemisphere: THREE.HemisphereLight,
  light: normalizeHumanView.IView["light"],
): {
  png: string;
  capturedUtc: string;
  placement: HumanCaptureCamera.IPlacement;
  canvas: { width: number; height: number; pixelRatio: number };
  renderer: { vendor: string; renderer: string };
} {
  renderer.setPixelRatio(1);
  renderer.setSize(HumanCaptureCamera.size, HumanCaptureCamera.size, false);
  const placement: HumanCaptureCamera.IPlacement = HumanCaptureCamera.place(
    shot,
    key,
    descriptor,
    bounds,
    1,
  );
  placement.light = applyHumanInspectionLighting(
    key,
    hemisphere,
    shot,
    new THREE.Vector3().fromArray(placement.target),
    bounds.getSize(new THREE.Vector3()).length(),
    light,
  );
  renderer.render(scene, shot);
  const capturedUtc: string = new Date().toISOString();
  const png: string =
    legend.length === 0
      ? renderer.domElement.toDataURL("image/png")
      : compose(renderer.domElement, legend);

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

/**
 * Copy the drawn WebGL frame onto a 2D canvas, add the curve legend, and encode it.
 *
 * Up to 32 entries are listed, one 18 px line each with a colour swatch; more
 * are summarized as a count. Frames without a selection never pass here, so
 * reference-comparable frames stay free of overlays.
 */
function compose(
  source: HTMLCanvasElement,
  legend: ReadonlyArray<{ id: string; colour: string }>,
): string {
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const context: CanvasRenderingContext2D = canvas.getContext("2d")!;
  context.drawImage(source, 0, 0);

  const shown: ReadonlyArray<{ id: string; colour: string }> = legend.slice(
    0,
    32,
  );
  const rows: number = shown.length + (legend.length > shown.length ? 1 : 0);
  context.font = "18px ui-monospace, monospace";
  const width: number = Math.max(
    ...shown.map(
      (entry: { id: string }): number => context.measureText(entry.id).width,
    ),
  );
  context.fillStyle = "rgba(255, 255, 255, 0.85)";
  context.fillRect(12, 12, width + 52, rows * 24 + 12);
  shown.forEach(
    (entry: { id: string; colour: string }, index: number): void => {
      const y: number = 24 + index * 24;
      context.fillStyle = entry.colour;
      context.fillRect(22, y, 18, 16);
      context.fillStyle = "#212529";
      context.fillText(entry.id, 48, y + 14);
    },
  );
  if (legend.length > shown.length)
    context.fillText(
      `+${legend.length - shown.length} more`,
      48,
      24 + shown.length * 24 + 14,
    );
  return canvas.toDataURL("image/png");
}
