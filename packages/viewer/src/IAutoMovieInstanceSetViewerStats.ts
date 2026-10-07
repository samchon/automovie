import type { IAutoMovieCompiledFormationLod } from "@automovie/interface";

/**
 * Bounded viewer accounting for one general instance set.
 *
 * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Displays this surface from the formation's selected resolution policy.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Implements the logical-to-display resolution boundary for instances.
 * @author Samchon
 */
export interface IAutoMovieInstanceSetViewerStats {
  /**
   * Slots currently drawn by automatic LOD tier.
   *
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Displays this surface from the formation's selected resolution policy.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Implements the logical-to-display resolution boundary for instances.
   */
  visible: Record<IAutoMovieCompiledFormationLod["tier"], number>;

  /**
   * Slots rejected by chunk-frustum culling.
   *
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Displays this surface from the formation's selected resolution policy.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Implements the logical-to-display resolution boundary for instances.
   */
  culled: number;

  /**
   * Slots intentionally hidden by authored or seeded visibility.
   *
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Displays this surface from the formation's selected resolution policy.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Implements the logical-to-display resolution boundary for instances.
   */
  hidden: number;
}
