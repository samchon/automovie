import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/**
 * One camera-selected runtime representation for anonymous formation slots.
 *
 * @evidence requirements/formations/layouts-and-slots.md#formation-layout-selection-parameters Exposes `IAutoMovieCompiledFormationLod` as the portable data boundary for the formation layout selection parameters requirement.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `IAutoMovieCompiledFormationLod` for the performance formation layout slot assignment system contract.
 */
export interface IAutoMovieCompiledFormationLod {
  /**
   * Semantic near-to-far tier.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-layout-selection-parameters Exposes `tier` as the portable data boundary for the formation layout selection parameters requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `tier` for the performance formation layout slot assignment system contract.
   */
  tier: "hero" | "near" | "far";

  /**
   * Positive maximum distance, or null only for the final tier.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-layout-selection-parameters Exposes `maxDistance` as the portable data boundary for the formation layout selection parameters requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `maxDistance` for the performance formation layout slot assignment system contract.
   */
  maxDistance: number | null;

  /**
   * Design recipe id.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-layout-selection-parameters Exposes `recipe` as the portable data boundary for the formation layout selection parameters requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `recipe` for the performance formation layout slot assignment system contract.
   */
  recipe: string;

  /**
   * Exact current recipe digest, including geometry and palette parameters.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-layout-selection-parameters Exposes `recipeDigest` as the portable data boundary for the formation layout selection parameters requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `recipeDigest` for the performance formation layout slot assignment system contract.
   */
  recipeDigest: AutoMovieContentDigest;

  /**
   * Compiler-owned runtime model id.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-layout-selection-parameters Exposes `model` as the portable data boundary for the formation layout selection parameters requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `model` for the performance formation layout slot assignment system contract.
   */
  model: string;
}
