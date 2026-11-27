import type * as THREE from "three";

import type { IAutoMovieRenderShadowRetirementHost } from "./IAutoMovieRenderShadowRetirementHost";

/**
 * Public renderer facts needed to bound its native shadow target factory. A
 * real WebGLRenderer satisfies this boundary; no drawing capability or GPU
 * resource ownership is transferred to the observer.
 */
export interface IAutoMovieRenderShadowTextureHost extends IAutoMovieRenderShadowRetirementHost {
  /** Current host shadow switch and native allocator family. */
  shadowMap: Pick<THREE.WebGLRenderer["shadowMap"], "enabled" | "type">;

  /** Maximum native two-dimensional texture extent in pixels. */
  capabilities: Pick<THREE.WebGLRenderer["capabilities"], "maxTextureSize">;
}
