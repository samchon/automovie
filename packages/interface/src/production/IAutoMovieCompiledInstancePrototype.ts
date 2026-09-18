import { IAutoMovieCompiledFormationLod } from "./IAutoMovieCompiledFormationLod";

/**
 * One builder-resolved reusable prototype in a general instance set.
 *
 * @evidence requirements/asset-authoring/identity-and-instances.md#asset-prototype-instance Exposes `IAutoMovieCompiledInstancePrototype` as the portable data boundary for the asset prototype and instance requirement.
 * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-prototype-instance Types `IAutoMovieCompiledInstancePrototype` for the asset prototype and instance system contract.
 */
export interface IAutoMovieCompiledInstancePrototype {
  /**
   * Stable source prototype id.
   *
   * @evidence requirements/asset-authoring/identity-and-instances.md#asset-prototype-instance Exposes `id` as the portable data boundary for the asset prototype and instance requirement.
   * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-prototype-instance Types `id` for the asset prototype and instance system contract.
   */
  id: string;
  /**
   * Source model recipe.
   *
   * @evidence requirements/asset-authoring/identity-and-instances.md#asset-prototype-instance Exposes `modelRecipe` as the portable data boundary for the asset prototype and instance requirement.
   * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-prototype-instance Types `modelRecipe` for the asset prototype and instance system contract.
   */
  modelRecipe: string;
  /**
   * Positive deterministic selection weight.
   *
   * @evidence requirements/asset-authoring/identity-and-instances.md#asset-prototype-instance Exposes `weight` as the portable data boundary for the asset prototype and instance requirement.
   * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-prototype-instance Types `weight` for the asset prototype and instance system contract.
   */
  weight: number;
  /**
   * Ordered automatic LOD representations for this prototype.
   *
   * @evidence requirements/asset-authoring/identity-and-instances.md#asset-prototype-instance Exposes `lod` as the portable data boundary for the asset prototype and instance requirement.
   * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-prototype-instance Types `lod` for the asset prototype and instance system contract.
   */
  lod: IAutoMovieCompiledFormationLod[];
  /**
   * Conservative source-model radius before per-slot scaling.
   *
   * @evidence requirements/asset-authoring/identity-and-instances.md#asset-prototype-instance Exposes `projectionRadius` as the portable data boundary for the asset prototype and instance requirement.
   * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-prototype-instance Types `projectionRadius` for the asset prototype and instance system contract.
   */
  projectionRadius: number;
}
