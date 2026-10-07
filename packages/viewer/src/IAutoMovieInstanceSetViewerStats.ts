import type { IAutoMovieCompiledFormationLod } from "@automovie/interface";

/**
 * Bounded viewer accounting for one general instance set.
 *
 * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Projects the compiled instance-set tier policy into persistent batch visibility and accounting.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-bounds-framing-culling-failures Keeps instance-set LOD and culling state separate from authored visibility and compact member identity.
 * @author Samchon
 */
export interface IAutoMovieInstanceSetViewerStats {
  /**
   * Slots currently drawn by automatic LOD tier.
   *
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Projects the compiled instance-set tier policy into persistent batch visibility and accounting.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-bounds-framing-culling-failures Keeps instance-set LOD and culling state separate from authored visibility and compact member identity.
   */
  visible: Record<IAutoMovieCompiledFormationLod["tier"], number>;

  /**
   * Slots rejected by chunk-frustum culling.
   *
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Projects the compiled instance-set tier policy into persistent batch visibility and accounting.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-bounds-framing-culling-failures Keeps instance-set LOD and culling state separate from authored visibility and compact member identity.
   */
  culled: number;

  /**
   * Slots intentionally hidden by authored or seeded visibility.
   *
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Projects the compiled instance-set tier policy into persistent batch visibility and accounting.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-bounds-framing-culling-failures Keeps instance-set LOD and culling state separate from authored visibility and compact member identity.
   */
  hidden: number;
}
