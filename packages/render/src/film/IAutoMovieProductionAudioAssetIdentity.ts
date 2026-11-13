import type {
  IAutoMovieProductionAudioProcessing,
  IAutoMovieProductionWaveSourceFormat,
} from "@automovie/ingest";

import type { IAutoMovieProductionAudioAssetIdentityBase } from "./IAutoMovieProductionAudioAssetIdentityBase.js";

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
 * @evidence contracts/development/design.md#principled-representation A discriminated union on `kind` makes the WAVE facts present exactly when the asset was decoded, so a consumer narrows by the tag instead of testing optional fields.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The shared facts come from `IAutoMovieProductionAudioAssetIdentityBase` and each arm adds only its provenance, reusing ingest's own source-format and processing types rather than restating them.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Neither arm special-cases an asset; the placeholder arm's fixed format is the sound plan's contract rate and channel count, which `normalizeAudioAssets` enforces.
 * @evidence contracts/development/common.md#meaningful-documentation The doc says what each arm carries, where the WAVE facts come from, which validator refuses a contradiction, and the placeholder format.
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
