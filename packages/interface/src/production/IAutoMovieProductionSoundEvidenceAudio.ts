import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/**
 * Final encoded audio identity retained by sound evidence.
 *
 * @evidence requirements/sound/validation-and-delivery.md#sound-final-media-probe Binds the sound evidence to the exact final audio path, type, size, and bytes inspected for delivery.
 * @evidence specifications/simulation-effects-and-sound/mix-stems-loudness-and-av-join.md#sound-delivery-stream-and-inventory Carries the final encoded audio inventory beside its plan and measurements.
 */
export interface IAutoMovieProductionSoundEvidenceAudio {
  /**
   * Render-root-relative sibling audio path.
   * @evidence requirements/sound/validation-and-delivery.md#sound-final-media-probe Binds evidence to the exact final audio member.
   * @evidence specifications/simulation-effects-and-sound/mix-stems-loudness-and-av-join.md#sound-delivery-stream-and-inventory Supplies the final audio inventory path.
   */
  path: string;
  /**
   * Closed final audio media type.
   * @evidence requirements/sound/validation-and-delivery.md#sound-final-media-probe Binds evidence to the encoded audio class.
   * @evidence specifications/simulation-effects-and-sound/mix-stems-loudness-and-av-join.md#sound-delivery-stream-and-inventory Supplies the final audio inventory type.
   */
  mediaType: "audio/mp4";
  /**
   * Exact sibling audio byte length.
   * @evidence requirements/sound/validation-and-delivery.md#sound-final-media-probe Binds evidence to the complete encoded byte population.
   * @evidence specifications/simulation-effects-and-sound/mix-stems-loudness-and-av-join.md#sound-delivery-stream-and-inventory Supplies the final audio size.
   */
  bytes: number;
  /**
   * Digest of the exact sibling audio bytes.
   * @evidence requirements/sound/validation-and-delivery.md#sound-final-media-probe Binds evidence to one encoded payload identity.
   * @evidence specifications/simulation-effects-and-sound/mix-stems-loudness-and-av-join.md#sound-delivery-stream-and-inventory Supplies the final audio digest.
   */
  digest: AutoMovieContentDigest;
}
