import { IAutoMovieModel, IAutoMovieModelPart } from "@automovie/interface";

/**
 * Deterministic geometry one archetype builds for one recipe.
 *
 * The materializer stores both fields in the compiled model without copying,
 * so a builder returns objects created for this call rather than shared
 * constants. For a recipe backed by an external model the materializer keeps
 * the skeleton and replaces the parts with a collision proxy.
 *
 * @evidence contracts/common.md#principled-implementation The geometry reuses the interface package's model skeleton and part types, so the materializer places a builder's result into the compiled model without conversion.
 * @evidence contracts/common.md#clear-and-simple-design Only the skeleton and parts come from the builder; the compiled model's id, name, materials and profiles stay with the materializer that owns them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Replacing the parts with a collision proxy for an external model is the materializer's documented contract, and this type carries no flag or branch for that path.
 * @evidence contracts/common.md#meaningful-documentation The prose gives the no-copy ownership rule that forces fresh objects and what the materializer keeps for an external model; the members give the null-skeleton condition and the part ordering.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This type only shapes a builder's result; the allocation of its bones and parts is costed on `build`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This return type coordinates no work. Builders must transfer fresh mutable geometry because materializeGeneratedModel adopts the records without cloning; the type itself does not prevent a custom builder from violating that ownership rule.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Shipped builders retain no returned records. Generated models adopt one optional skeleton and part list per recipe; imported composition retains the skeleton and substitutes a proxy list, releasing the unused generated parts when their temporary model becomes unreachable. Model ownership determines the remaining lifetime.
 * @author Samchon
 */
export interface IAutoMovieArchetypeGeometry {
  /** Builder-owned skeleton, or null for an archetype whose `bones` is empty. */
  skeleton: IAutoMovieModel["skeleton"];

  /** Visible parts in deterministic order, each referencing the input material. */
  parts: IAutoMovieModelPart[];
}
