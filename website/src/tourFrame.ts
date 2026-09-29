/**
 * On-demand frame policy passed to the existing AutoMovie viewer mount. The
 * mount owns renderer acquisition, animation timing and stop; this callback
 * redraws a static native scene only after camera or viewport changes. Canvas
 * dimensions are CSS pixels and the framebuffer uses the mounted pixel ratio.
 * A zero-sized hidden viewport retains its invalidation until it becomes visible.
 */
import type * as THREE from "three";

export const createTourFrame = (options: {
  canvas: Pick<
    HTMLCanvasElement,
    "width" | "height" | "clientWidth" | "clientHeight"
  >;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  renderer: Pick<THREE.WebGLRenderer, "getPixelRatio" | "setSize" | "render">;
  finish(): void;
}): { frame(): boolean; invalidate(): void } => {
  let redraw = true;
  return {
    invalidate: () => {
      redraw = true;
    },
    frame: () => {
      const { canvas, camera, renderer, scene } = options;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width > 0 && height > 0) {
        const ratio = renderer.getPixelRatio();
        if (
          canvas.width !== Math.floor(width * ratio) ||
          canvas.height !== Math.floor(height * ratio)
        ) {
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          redraw = true;
        }
        if (redraw) {
          renderer.render(scene, camera);
          options.finish();
          redraw = false;
        }
      }
      return true;
    },
  };
};
