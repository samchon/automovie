/**
 * On-demand frame policy passed to the existing AutoMovie viewer mount. The mount owns renderer acquisition, animation timing and stop; this callback redraws a static native scene only after camera or viewport changes. Canvas dimensions are CSS pixels and the framebuffer uses the mounted pixel ratio. A zero-sized hidden viewport retains its invalidation until it becomes visible.
 */
import type * as THREE from "three";

/**
 * Create the mount's invalidation callback for a static scene; redraw follows camera or CSS viewport changes, and hidden zero-sized viewports retain pending redraw. Returning true tells mountViewer that this callback owns drawing; it does not itself publish handled-frame facts to the viewer's completion observer.
 *
 * @evidence contracts/common.md#principled-implementation A dirty flag and framebuffer dimensions control redraw of a static scene; CSS dimensions and the renderer's current pixel ratio determine resize and perspective aspect, while hidden dimensions leave pending work intact.
 * @evidence contracts/common.md#clear-and-simple-design This callback owns draw admission only; mountViewer owns renderer acquisition and animation scheduling, and the tour host owns camera invalidation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Current viewport observations replace timers or assumed sizes; no foreign renderer method is replaced, and a handled return is not claimed to publish completed-frame evidence.
 * @evidence contracts/common.md#meaningful-documentation The comment explains invalidation, hidden viewport retention, handled-frame return meaning and the completion-observer limitation.
 * @evidence contracts/performance.md#efficient-algorithms Idle coordination costs constant time; invalidated frames add actual renderer traversal/GPU cost and the supplied finish operation, which currently calls gl.finish and can block on GPU completion.
 * @evidence contracts/performance.md#reuse-equivalent-work A successful draw clears the dirty flag and keeps the native framebuffer for a static scene; camera or size changes invalidate that equivalence, and failed render/finish leaves redraw pending.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One callback retains its borrowed canvas, camera, scene, renderer and dirty flag; it owns no RAF or GPU acquisition, so the host must discard it and stop the mounted viewer at teardown.
 */
export const createTourFrame: (options: { canvas: Pick<HTMLCanvasElement, "width" | "height" | "clientWidth" | "clientHeight">; camera: THREE.PerspectiveCamera; scene: THREE.Scene; renderer: Pick<THREE.WebGLRenderer, "getPixelRatio" | "setSize" | "render">; finish(): void; }) => { frame(): boolean; invalidate(): void; } = (options: {
  /** Borrowed native CSS and framebuffer dimensions, observed every frame. */
  canvas: Pick<
    HTMLCanvasElement,
    "width" | "height" | "clientWidth" | "clientHeight"
  >;

  /** Existing perspective camera whose aspect follows visible CSS dimensions. */
  camera: THREE.PerspectiveCamera;

  /** Static native scene, drawn only after invalidation or resize. */
  scene: THREE.Scene;

  /** Borrowed mounted renderer; this callback does not own its disposal. */
  renderer: Pick<THREE.WebGLRenderer, "getPixelRatio" | "setSize" | "render">;

  /** Called after drawing; a throw leaves redraw pending. */
  finish(): void;
}): {
  /** Attempt pending visible drawing and return the handled-frame flag. */
  frame(): boolean;

  /** Retain a redraw request until a visible frame completes. */
  invalidate(): void;
} => {
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
