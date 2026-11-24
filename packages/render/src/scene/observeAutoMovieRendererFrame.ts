import type { IAutoMovieObservedRenderResult } from "@automovie/interface";
import type { IAutoMovieRendererFrameCounters } from "./IAutoMovieRendererFrameCounters.js";

/**
 * Draw one complete frame while measuring renderer-confirmed submissions.
 *
 * `WebGLRenderer.info` is the authority for calls and triangles because it is
 * updated after camera layers, frustum culling, geometry groups, draw ranges,
 * and material visibility have selected the work that reaches the renderer.
 * Disabling its per-render reset makes the measurement frame-wide: a dissolve
 * therefore includes the outgoing draw, incoming draw, and composite pass.
 *
 * The remaining budget dimensions deliberately stay `null`. Three exposes
 * renderer-lifetime allocations for some of them and no post-culling frame
 * count for the rest; a scene traversal would be an estimate, not an
 * observation.
 */
export const observeAutoMovieRendererFrame: <Output>(
  renderer: IAutoMovieRendererFrameCounters,
  draw: () => Output,
) => IAutoMovieObservedRenderResult<Output> = <Output>(
  renderer: IAutoMovieRendererFrameCounters,
  draw: () => Output,
): IAutoMovieObservedRenderResult<Output> => {
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
