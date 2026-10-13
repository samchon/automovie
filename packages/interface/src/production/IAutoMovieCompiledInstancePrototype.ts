import { IAutoMovieCompiledFormationLod } from "./IAutoMovieCompiledFormationLod";

/**
 * One builder-resolved reusable prototype in a general instance set. Weight participates in deterministic per-slot selection; projectionRadius bounds the source before per-slot scaling.
 *
 * @evidence contracts/common.md#principled-implementation Stable prototype identity and positive selection weight define the seeded choice population, with ordered compiled LOD models and conservative unscaled radius supplying view-dependent representation and culling inputs.
 * @evidence contracts/common.md#clear-and-simple-design Prototype-specific recipe, weight, tiers and radius live once in the compiled table instead of repeating model definitions and selection parameters on each generated slot.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Prototype selection uses the declared weighted seeded law rather than instance labels, and per-slot scale must act on the stored source radius rather than silently treating every instance as unit sized.
 * @evidence contracts/common.md#meaningful-documentation Defines builder resolution, positive deterministic weight, LOD ordering, recipe ownership and the radius's metre units before slot scaling.
 * @author Samchon
 */
export interface IAutoMovieCompiledInstancePrototype {
  /** Stable source prototype id. */
  id: string;

  /** Source model recipe. */
  modelRecipe: string;

  /** Positive deterministic selection weight. */
  weight: number;

  /** Ordered automatic LOD representations for this prototype. */
  lod: IAutoMovieCompiledFormationLod[];

  /** Conservative source-model radius before per-slot scaling. */
  projectionRadius: number;
}
