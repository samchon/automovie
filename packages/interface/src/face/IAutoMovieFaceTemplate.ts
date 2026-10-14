/**
 * A face template in flat-array form: the position data an {@link IAutoMovieFace} morphs.
 *
 * `positions` is the authored resting face, optionally with an identity already baked in, and `targets` maps names to per-vertex xyz deltas. `ingestFaceTemplate` copies POSITION data from the first morphed primitive of its parsed glTF document; it does not apply an `identity` target. The engine's `morphFace` copies these positions and adds the face's weighted target deltas.
 *
 * `morphFace` reads only projected traits, including explicit zero weights; names outside the face vocabulary are retained but never applied. A missing projected target or unequal component count throws, while ingestion checks every target's count. Neither function checks component finiteness or that the resting count is a multiple of three, and finite inputs can still overflow during weighted addition. The caller supplies valid xyz layout and arithmetic suitable for its downstream geometry consumer.
 *
 * @evidence contracts/common.md#principled-implementation Mirrors the glTF morph-target model: a resting position array plus additive per-component deltas keyed by name, which is exactly what `morphFace`'s `positions + sum(weight * delta)` needs and what `ingestFaceTemplate` decodes from `POSITION` accessors.
 * @evidence contracts/common.md#clear-and-simple-design One resting array and a name-keyed record of delta arrays carry no topology, normals or indices; morphing returns positions while the source asset owns the remaining geometry data.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unused names survive ingestion, missing or mis-sized projected targets throw even at zero weight, and xyz layout, finite components and derived arithmetic are explicit caller premises rather than claimed validation.
 * @evidence contracts/common.md#meaningful-documentation States primitive selection, unchanged identity targets, projection versus unused names, length refusals, unchecked layout and arithmetic, and the array layout the caller supplies.
 * @author Samchon
 */
export interface IAutoMovieFaceTemplate {
  /** Resting vertex positions as consecutive xyz triples, in the asset's units. */
  positions: number[];

  /**
   * Morph-target deltas by target name, each a per-component offset array that must be `positions.length` long to be applied.
   */
  targets: Record<string, number[]>;
}
