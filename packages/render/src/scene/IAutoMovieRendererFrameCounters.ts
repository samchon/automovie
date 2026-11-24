import type * as THREE from "three";

/**
 * The part of a `THREE.WebGLRenderer` that counts one frame's submissions: its
 * info's reset policy, its reset and the calls and triangles it has counted.
 */
export interface IAutoMovieRendererFrameCounters {
  /** The renderer's submission counters. */
  info: Pick<THREE.WebGLInfo, "autoReset" | "reset"> & {
    /** Calls and triangles submitted since the last reset. */
    render: Pick<THREE.WebGLInfo["render"], "calls" | "triangles">;
  };
}