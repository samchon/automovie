import type { IAutoMovieProductionAudioProcessing } from "../production/IAutoMovieProductionAudioProcessing.js";
import type { IAutoMovieProductionWaveSourceFormat } from "../production/IAutoMovieProductionWaveSourceFormat.js";
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
