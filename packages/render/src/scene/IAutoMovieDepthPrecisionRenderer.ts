import type * as THREE from "three";

/**
 * The part of a `THREE.WebGLRenderer` a camera depth-precision check reads: the
 * depth-buffer capabilities and the bound framebuffer's depth bits.
 */
export interface IAutoMovieDepthPrecisionRenderer {
  /** Whether depth is logarithmic or reversed. */
  capabilities: Pick<
    THREE.WebGLCapabilities,
    "logarithmicDepthBuffer" | "reversedDepthBuffer"
  >;

  /** The context whose bound framebuffer reports its depth bits. */
  getContext(): Pick<WebGLRenderingContext, "DEPTH_BITS" | "getParameter">;
}
