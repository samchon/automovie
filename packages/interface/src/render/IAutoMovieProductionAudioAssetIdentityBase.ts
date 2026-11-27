/**
 * Byte, clock and channel facts every planned audio asset carries, whatever its
 * provenance.
 *
 * The placeholder and WAVE arms of `IAutoMovieProductionAudioAssetIdentity`
 * both extend it. `normalizeAudioAssets` refuses a record whose path is blank
 * or repeated, whose digest is not a SHA-256 content digest, whose counts are
 * not positive safe integers, or whose duration differs from `sourceFrames /
 * sampleRate`.
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
