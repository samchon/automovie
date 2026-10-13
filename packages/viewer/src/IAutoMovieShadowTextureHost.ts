import type * as THREE from "three";

/**
 * Public renderer facts needed to bound its native shadow target factory.
 * A real WebGLRenderer satisfies this boundary; no drawing capability or GPU
 * resource ownership is transferred to the observer.
 *
 * @author Samchon
 */
export interface IAutoMovieShadowTextureHost {
  /** Current host shadow switch and native allocator family. */
  shadowMap: Pick<THREE.WebGLRenderer["shadowMap"], "enabled" | "type">;

  /** Maximum native two-dimensional texture extent in pixels. */
  capabilities: Pick<THREE.WebGLRenderer["capabilities"], "maxTextureSize">;
}
