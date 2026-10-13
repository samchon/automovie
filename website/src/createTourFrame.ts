/**
 * On-demand frame policy passed to the existing AutoMovie viewer mount. The mount owns renderer acquisition, animation timing and stop; this callback redraws a static native scene only after camera or viewport changes. Canvas dimensions are CSS pixels and the framebuffer uses the mounted pixel ratio. A zero-sized hidden viewport retains its invalidation until it becomes visible.
 */
import type * as THREE from "three";

/** Creates the mount's invalidation callback for a static scene; redraw follows camera or CSS viewport changes, and hidden zero-sized viewports retain pending redraw. */
export const createTourFrame: (options: { canvas: Pick<HTMLCanvasElement, "width" | "height" | "clientWidth" | "clientHeight">; camera: THREE.PerspectiveCamera; scene: THREE.Scene; renderer: Pick<THREE.WebGLRenderer, "getPixelRatio" | "setSize" | "render">; finish(): void; }) => { frame(): boolean; invalidate(): void; } = (options: {
  canvas: Pick<
    HTMLCanvasElement,
    "width" | "height" | "clientWidth" | "clientHeight"
  >;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  renderer: Pick<THREE.WebGLRenderer, "getPixelRatio" | "setSize" | "render">;
  finish(): void;
}): { frame(): boolean; invalidate(): void } => {
  let redraw: boolean = true;
  return {
    invalidate: () : void => {
      redraw = true;
    },
    frame: () : true => {
      const { canvas, camera, renderer, scene }: { canvas: Pick<HTMLCanvasElement, "width" | "height" | "clientWidth" | "clientHeight">; camera: THREE.PerspectiveCamera; scene: THREE.Scene; renderer: Pick<THREE.WebGLRenderer, "getPixelRatio" | "setSize" | "render">; finish(): void; } = options;
      const width: number = canvas.clientWidth;
      const height: number = canvas.clientHeight;
      if (width > 0 && height > 0) {
        const ratio: number = renderer.getPixelRatio();
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
