
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
 * @evidence contracts/common.md#principled-implementation Sample count and rate carry integer clock facts, while durationSeconds equals their binary64 quotient rather than an exact rational value. The planner checks cue spans against sourceFrames using exact frame-to-sample conversion instead of deriving sample count from rounded seconds.
 * @evidence contracts/common.md#clear-and-simple-design The fields that do not depend on provenance live here once, and the union type adds only what each arm needs, so the two arms cannot describe the shared facts differently.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The interface encodes no default or special value; every constraint on its fields is enforced by `normalizeAudioAssets`, which the doc names.
 * @evidence contracts/common.md#meaningful-documentation The doc names the union that extends it and the validator with each refusal, and every member states its unit, source or derivation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An interface runs no algorithm; the validation cost is answered on `normalizeAudioAssets`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Six scalar facts about one asset carry no computation of their own; the shared base exists to avoid restating fields, not to share work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Path, digest and counts are plain values that keep no file open; they live inside whichever asset identity extends them.
 * @author Samchon
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
