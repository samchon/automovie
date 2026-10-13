import type {
  IAutoMovieProductionAudioProcessing,
  IAutoMovieProductionWaveSourceFormat,
} from "@automovie/ingest";

import type { IAutoMovieProductionAudioAssetIdentityBase } from "./IAutoMovieProductionAudioAssetIdentityBase";

/**
 * Source-format or placeholder provenance of one audio asset a render plan
 * references.
 *
 * The `wave` arm carries the decoder's source format and processing record
 * unchanged, and `normalizeAudioAssets` refuses it when either contradicts the
 * record's own rate and channel count. The `placeholder-audio-stem` arm names a
 * deterministic guide stem in the sound plan's 48 kHz stereo format and carries
 * no WAVE facts, so a stem cannot pose as a decoded source.
 *
 * @evidence contracts/common.md#principled-implementation A discriminated union on `kind` makes the WAVE facts present exactly when the asset was decoded, so a consumer narrows by the tag instead of testing optional fields.
 * @evidence contracts/common.md#clear-and-simple-design The shared facts come from `IAutoMovieProductionAudioAssetIdentityBase` and each arm adds only its provenance, reusing ingest's own source-format and processing types rather than restating them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither arm special-cases an asset; the placeholder arm's fixed format is the sound plan's contract rate and channel count, which `normalizeAudioAssets` enforces.
 * @evidence contracts/common.md#meaningful-documentation The doc says what each arm carries, where the WAVE facts come from, which validator refuses a contradiction, and the placeholder format.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A union type runs no algorithm; validation cost is answered on `normalizeAudioAssets` and `validWaveAudioIdentity`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The provenance union is data passed into one planning call; deciding whether two decoded assets are the same is the digest's job, not this type's.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources An asset identity references no file or decoder handle; the plan's `tracks.audioAssets` copy owns each instance for the plan's lifetime.
 * @author Samchon
 */
export type IAutoMovieProductionAudioAssetIdentity =
  IAutoMovieProductionAudioAssetIdentityBase &
    (
      | {
          /** A deterministic guide stem with no decoded source. */
          kind: "placeholder-audio-stem";
        }
      | {
          /** A decoded RIFF/WAVE source. */
          kind: "wave";

          /** The WAVE declaration the decoder read, before processing. */
          sourceFormat: IAutoMovieProductionWaveSourceFormat;

          /** The conversion the decoder applied to produce mixer input. */
          processing: IAutoMovieProductionAudioProcessing;
        }
    );
