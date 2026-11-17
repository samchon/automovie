/**
 * Byte, clock and channel facts every planned audio asset carries, whatever
 * its provenance.
 *
 * The placeholder and WAVE arms of `IAutoMovieProductionAudioAssetIdentity`
 * both extend it. `normalizeAudioAssets` refuses a record whose path is blank
 * or repeated, whose digest is not a SHA-256 content digest, whose counts are
 * not positive safe integers, or whose duration differs from
 * `sourceFrames / sampleRate`.
 *
 * @evidence contracts/development/design.md#principled-representation Sample count and rate carry integer clock facts, while durationSeconds equals their binary64 quotient rather than an exact rational value. The planner checks cue spans against sourceFrames using exact frame-to-sample conversion instead of deriving sample count from rounded seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The fields that do not depend on provenance live here once, and the union type adds only what each arm needs, so the two arms cannot describe the shared facts differently.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The interface encodes no default or special value; every constraint on its fields is enforced by `normalizeAudioAssets`, which the doc names.
 * @evidence contracts/development/common.md#meaningful-documentation The doc names the union that extends it and the validator with each refusal, and every member states its unit, source or derivation.
 */
export interface IAutoMovieProductionAudioAssetIdentityBase {
  /** Project-relative path of the builder-declared asset, unique in a plan. */
  path: string;

  /** SHA-256 content digest of the asset's current bytes. */
  digest: string;

  /** Complete source runtime in seconds, exactly `sourceFrames / sampleRate`. */
  durationSeconds: number;

  /** Number of source sample frames in the asset; a positive safe integer. */
  sourceFrames: number;

  /** Source sample rate in samples per second; a positive safe integer. */
  sampleRate: number;

  /** Source channel count; a positive safe integer. */
  channels: number;
}
