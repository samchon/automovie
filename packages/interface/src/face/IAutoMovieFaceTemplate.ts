/**
 * A face template in render-ready flat-array form: the geometry an
 * {@link IAutoMovieFace} morphs.
 *
 * `positions` is the template's resting face, either the canonical neutral or a
 * character with its `identity` morph already baked in, and `targets` maps each
 * morph-target name to per-vertex xyz deltas. This is what a glTF face asset
 * carries, `POSITION` plus named morph targets, so `ingestFaceTemplate` in
 * `@automovie/ingest` fills it from the first morphed primitive of a file and
 * the engine's `morphFace` consumes it without further shaping.
 *
 * `morphFace` reads only the targets whose traits the face sets, so a target
 * the face vocabulary never names, such as an `identity` likeness, is carried
 * but never applied. It throws when a set trait has no target or that target's
 * length differs from `positions.length`; `ingestFaceTemplate` refuses a
 * mismatched target of any name. Nothing checks that `positions.length` is a
 * multiple of three.
 *
 * @evidence contracts/common.md#principled-implementation Mirrors the glTF morph-target model: a resting position array plus additive per-component deltas keyed by name, which is exactly what `morphFace`'s `positions + sum(weight * delta)` needs and what `ingestFaceTemplate` decodes from `POSITION` accessors.
 * @evidence contracts/common.md#clear-and-simple-design Two flat number arrays and a name-keyed record carry no topology, normals or indices, because the morph only moves positions and everything else stays on the source asset.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unused targets are kept rather than filtered against the face vocabulary, and a missing or mis-sized target for a set trait throws in `morphFace` instead of being skipped; the unchecked triple length is stated as a remaining gap.
 * @evidence contracts/common.md#meaningful-documentation States what the resting positions may be, the glTF correspondence, the producer and consumer, which targets are applied, both throwing conditions, and the unchecked triple length; members give the layout and length of each array.
 * @author Samchon
 */
export interface IAutoMovieFaceTemplate {
  /** Resting vertex positions as consecutive xyz triples, in the asset's units. */
  positions: number[];

  /**
   * Morph-target deltas by target name, each a per-component offset array that
   * must be `positions.length` long to be applied.
   */
  targets: Record<string, number[]>;
}
