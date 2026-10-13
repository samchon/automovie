/**
 * A face template in render-ready flat-array form: the geometry side of the
 * face editor that an {@link IAutoMovieFace} morphs.
 *
 * `positions` is the template's resting face (the canonical neutral, or a
 * character with its `identity` morph already baked in), and `targets` maps
 * each morph-target name to per-vertex xyz deltas of the same length. This
 * matches what a glTF face asset carries (POSITION plus named morph targets),
 * so `ingest` fills it straight from the file and the engine's `morphFace`
 * consumes it without further shaping.
 *
 * A target the face vocabulary never names, such as an `identity` likeness, is
 * carried but never applied by `morphFace`. `morphFace` throws when a trait the
 * face sets has no target or a target's length differs from `positions`.
 *
 * @evidence contracts/common.md#principled-implementation Flat xyz arrays matching glTF `POSITION` plus named morph deltas, so `morphFace` evaluates `positions + Σ weight·delta` over a copy in one pass per present trait and `ingestFaceTemplate` fills the record straight from the first primitive that has morph targets.
 * @evidence contracts/common.md#clear-and-simple-design `targets` is keyed by plain string rather than by `AutoMovieFaceParameterName` because an asset can carry targets outside the vocabulary, which the template keeps without the engine having to know them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Structural defects are refused, not repaired: ingest throws on an unnamed, duplicate-named or wrong-length target, and `morphFace` throws on a missing target or mismatched delta length instead of skipping it.
 * @evidence contracts/common.md#meaningful-documentation States the xyz-triple layout, that every target matches `positions.length`, where the template comes from, which function consumes it, and which mismatches throw.
 * @author Samchon
 */
export interface IAutoMovieFaceTemplate {
  /** Resting vertex positions, xyz triples. */
  positions: number[];

  /** Morph-target deltas by parameter name, each `positions.length` long. */
  targets: Record<string, number[]>;
}
