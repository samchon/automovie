import type * as THREE from "three";

/**
 * Public renderer facts needed to bound its native shadow target factory.
 * A real WebGLRenderer satisfies this boundary; no drawing capability or GPU
 * resource ownership is transferred to the observer.
 *
 * @evidence contracts/development/design.md#principled-representation Exposes only the actual shadow enable/filter policy and maximum native texture extent needed to bound Three's shadow target factory.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Narrow Pick projections let the shadow observer read factual allocation inputs without depending on drawing or renderer teardown capability.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The observer receives public renderer fields rather than native cache keys or estimated values tailored to a scene budget.
 * @evidence contracts/development/common.md#meaningful-documentation States that the real renderer satisfies the boundary, describes each observed fact and explicitly retains resource ownership with the host.
 */
export interface IAutoMovieShadowTextureHost {
  /** Current host shadow switch and native allocator family. */
  shadowMap: Pick<THREE.WebGLRenderer["shadowMap"], "enabled" | "type">;

  /** Maximum native two-dimensional texture extent in pixels. */
  capabilities: Pick<THREE.WebGLRenderer["capabilities"], "maxTextureSize">;
}
