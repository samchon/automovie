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
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Geometry is stored without copying into exactly one compiled model, so it is never shared between recipes and no equivalent work is repeated.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The compiled model owns the skeleton and parts from the moment the materializer stores them, they are held as long as that model, and the builder keeps no reference, so the retained population is one skeleton and one part list per generated recipe.
 * @author Samchon
 */
export interface IAutoMovieArchetypeGeometry {
  /** Builder-owned skeleton, or null for an archetype whose `bones` is empty. */
  skeleton: IAutoMovieModel["skeleton"];

  /** Visible parts in deterministic order, each referencing the input material. */
  parts: IAutoMovieModelPart[];
}
