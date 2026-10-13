import type * as THREE from "three";

/**
 * Public renderer facts needed to bound its native shadow target factory.
 * A real WebGLRenderer satisfies this boundary; no drawing capability or GPU
 * resource ownership is transferred to the observer.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Supplies actual host policy and hardware extent for shadow attachment bounds.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Keeps native factory inputs separate from author-entered byte estimates.
 * @author Samchon
 */
export interface IAutoMovieShadowTextureHost {
  /**
   * Current host shadow switch and native allocator family.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Identifies which native factory the current host would execute.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Retains host fallback policy when no explicit scene override is supplied.
   */
  shadowMap: Pick<THREE.WebGLRenderer["shadowMap"], "enabled" | "type">;

  /**
   * Maximum native two-dimensional texture extent in pixels.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Supplies the public hardware clamp used by Three r186's shadow factory.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Bounds the source map size through the actual host's capability.
   */
  capabilities: Pick<THREE.WebGLRenderer["capabilities"], "maxTextureSize">;
}
