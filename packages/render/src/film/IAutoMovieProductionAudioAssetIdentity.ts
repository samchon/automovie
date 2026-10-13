import type {
  IAutoMovieProductionAudioProcessing,
  IAutoMovieProductionWaveSourceFormat,
} from "@automovie/ingest";

import type { IAutoMovieProductionAudioAssetIdentityBase } from "./IAutoMovieProductionAudioAssetIdentityBase";

/**
 * Exact source-format or placeholder provenance carried by one audio asset.
 *
 * A WAVE arm carries the decoder's source facts and processing lineage into
 * the plan unchanged, and planning refuses an identity whose format, layout,
 * precision, or processing contradicts its own rate and channel count. The
 * placeholder arm names a deterministic guide stem and carries no WAVE facts,
 * so a stem cannot pose as a decoded source.
 */
export type IAutoMovieProductionAudioAssetIdentity =
  IAutoMovieProductionAudioAssetIdentityBase &
    (
      | { kind: "placeholder-audio-stem" }
      | {
          kind: "wave";
          sourceFormat: IAutoMovieProductionWaveSourceFormat;
          processing: IAutoMovieProductionAudioProcessing;
        }
    );
