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
 * @author Samchon
 */
export interface IAutoMovieFaceTemplate {
  /** Resting vertex positions, xyz triples. */
  positions: number[];

  /** Morph-target deltas by parameter name, each `positions.length` long. */
  targets: Record<string, number[]>;
}
