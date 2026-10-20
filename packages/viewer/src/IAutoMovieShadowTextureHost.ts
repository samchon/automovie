import type * as THREE from "three";

/**
 * Public renderer facts needed to bound its native shadow target factory.
 * A real WebGLRenderer satisfies this boundary; no drawing capability or GPU
 * resource ownership is transferred to the observer.
 *
 * @evidence contracts/common.md#principled-implementation Exposes only the actual shadow enable/filter policy and maximum native texture extent needed to bound Three's shadow target factory.
 * @evidence contracts/common.md#clear-and-simple-design Narrow Pick projections let the shadow observer read factual allocation inputs without depending on drawing or renderer teardown capability.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The observer receives public renderer fields rather than native cache keys or estimated values tailored to a scene budget.
 * @evidence contracts/common.md#meaningful-documentation States that the real renderer satisfies the boundary, describes each observed fact and explicitly retains resource ownership with the host.
 * @evidenceExclude contracts/performance.md#efficient-algorithms These public field projections perform no shadow-map sizing or traversal themselves.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Current renderer policy fields are inputs, not a reusable result or cache key contract.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No drawing capability, GPU context or target ownership is acquired by declaring the observer boundary.
 */
export interface IAutoMovieShadowTextureHost {
  /** Current host shadow switch and native allocator family. */
  shadowMap: Pick<THREE.WebGLRenderer["shadowMap"], "enabled" | "type">;

  /** Maximum native two-dimensional texture extent in pixels. */
  capabilities: Pick<THREE.WebGLRenderer["capabilities"], "maxTextureSize">;
}
