import type { IAutoMovieRenderObservation } from "@automovie/interface";
import type * as THREE from "three";

/**
 * Draw one complete frame while measuring renderer-confirmed submissions.
 *
 * `WebGLRenderer.info` is the authority for calls and triangles because it is updated after camera layers, frustum culling, geometry groups, draw ranges, and material visibility have selected the work that reaches the renderer. Disabling its per-render reset makes the measurement frame-wide: a dissolve therefore includes the outgoing draw, incoming draw, and composite pass.
 *
 * The remaining budget dimensions deliberately stay `null`. Three exposes renderer-lifetime allocations for some of them and no post-culling frame count for the rest; a scene traversal would be an estimate, not an observation.
 *
 * @evidence contracts/common.md#principled-implementation Resets actual renderer submission counters once, disables automatic per-render reset and immediately samples calls/triangles after the supplied synchronous frame draw, restoring its original autoReset flag in finally.
 * @evidence contracts/common.md#clear-and-simple-design Submission observation stays separate from geometry budget estimates and draw ownership; unobservable post-culling dimensions remain explicitly null.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Scene traversal is not substituted for submitted work, counters are not claimed as pixels or GPU allocations and asynchronous draw completion is outside this immediate sampling contract.
 * @evidence contracts/common.md#meaningful-documentation Documents frame-wide multi-draw aggregation, nullable dimensions, live writable SDK-info premise and draw-failure/reset restoration; prior counters are intentionally replaced rather than restored.
 * @evidence contracts/performance.md#efficient-algorithms Coordinator work is fixed around the actual draw and counter reads, allocating one small record without an extra scene or pixel scan.
 * @evidence contracts/performance.md#reuse-equivalent-work One counter-reset epoch aggregates every synchronous source/composite draw in the requested frame; another frame must reset anew and cannot reuse older submission counts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The renderer is borrowed, no GPU owner is acquired and autoReset is restored after reset/draw completion or failure; caller must keep the SDK info object live and writable throughout the scope.
 */
export const observeAutoMovieRendererFrame: <Output>(renderer: THREE.WebGLRenderer, draw: () => Output) => { output: Output; observed: IAutoMovieRenderObservation } = <Output>(
  renderer: THREE.WebGLRenderer,
  draw: () => Output,
): { output: Output; observed: IAutoMovieRenderObservation } => {
  const previousAutoReset: boolean = renderer.info.autoReset;
  renderer.info.autoReset = false;
  try {
    renderer.info.reset();
    const output: Output = draw();
    return {
      output,
      observed: {
        meshes: null,
        drawCalls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        materials: null,
        textures: null,
        lights: null,
        shadowMaps: null,
        instanceSlots: null,
      },
    };
  } finally {
    renderer.info.autoReset = previousAutoReset;
  }
};
