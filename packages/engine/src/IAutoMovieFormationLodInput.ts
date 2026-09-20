import { IAutoMovieCompiledFormationLod } from "@automovie/interface";

/**
 * Inputs to the deterministic automatic formation LOD selector.
 *
 * @evidence requirements/asset-authoring/representations-bounds-and-lod.md#asset-lod-transition-stability Carries the ordered tiers, image contribution, previous choice, and deadband that prevent formation LOD flicker.
 * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Exposes the compiled tiers and explicit selection operands instead of letting rendering choose an undeclared representation.
 * @evidence specifications/asset-and-representation/bounds-proxies-and-lod.md#asset-spec-lod-transition-invariants Defines the complete input boundary for stable representation transitions.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-bounds-framing-culling-failures Carries the distance, projected contribution, prior tier, and hysteresis used for an inspectable formation-resolution decision.
 */
export interface IAutoMovieFormationLodInput {
  /**
   * Ordered compiled anonymous representations.
   *
   * @evidence requirements/asset-authoring/representations-bounds-and-lod.md#asset-lod-transition-stability Supplies the fixed near-to-far candidates between which the formation may transition.
   * @evidence specifications/asset-and-representation/bounds-proxies-and-lod.md#asset-spec-lod-transition-invariants Keeps transition choice within compiled compatible representations.
   */
  lod: readonly IAutoMovieCompiledFormationLod[];
  /**
   * Camera-to-chunk-centroid distance in meters.
   *
   * @evidence requirements/asset-authoring/representations-bounds-and-lod.md#asset-lod-transition-stability Provides the spatial contribution used on both sides of an LOD boundary.
   * @evidence specifications/asset-and-representation/bounds-proxies-and-lod.md#asset-spec-lod-transition-invariants Makes distance an explicit transition operand instead of renderer-local state.
   */
  distance: number;
  /**
   * Projected representative-member diameter in physical pixels.
   *
   * @evidence requirements/asset-authoring/representations-bounds-and-lod.md#asset-lod-transition-stability Stabilizes formation detail by accounting for actual screen contribution as well as distance.
   * @evidence specifications/asset-and-representation/bounds-proxies-and-lod.md#asset-spec-lod-transition-invariants Exposes the image-space operand that participates in the transition metric.
   */
  projectedPixels: number;
  /**
   * Tier retained from the previous frame, or null on first selection.
   *
   * @evidence requirements/asset-authoring/representations-bounds-and-lod.md#asset-lod-transition-stability Carries temporal state needed to retain a tier inside the boundary deadband.
   * @evidence specifications/asset-and-representation/bounds-proxies-and-lod.md#asset-spec-lod-transition-invariants Prevents adjacent frames from making independent threshold decisions.
   */
  previous: IAutoMovieCompiledFormationLod["tier"] | null;
  /**
   * Fractional boundary deadband; 0.1 by default.
   *
   * @evidence requirements/asset-authoring/representations-bounds-and-lod.md#asset-lod-transition-stability States the hysteresis width that suppresses repeated LOD flipping near a threshold.
   * @evidence specifications/asset-and-representation/bounds-proxies-and-lod.md#asset-spec-lod-transition-invariants Makes transition stability a declared parameter rather than a hidden renderer constant.
   */
  hysteresis?: number;
}
