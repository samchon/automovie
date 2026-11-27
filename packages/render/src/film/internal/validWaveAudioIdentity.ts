import type {
  IAutoMovieProductionAudioAssetIdentity,
  IAutoMovieProductionAudioProcessing,
  IAutoMovieProductionSoundPlan,
  IAutoMovieProductionWaveSourceFormat,
} from "@automovie/interface";

import { equalOrderedScalarRows } from "./equalOrderedScalarRows";
import { equalOrderedScalars } from "./equalOrderedScalars";

/*
 * Whether a WAVE asset's source format and processing record are exactly what
 * `AutoMovieIngestAudio.decodeAsset` reports for a file of the asset's own rate and
 * channel count, decoded for the 48 kHz mix.
 *
 * The asset must be mono or stereo with source rate and channels equal to its
 * own. The encoding must be 16-bit PCM or 32-bit float in a container of the
 * same width; the speakers must be front-center for mono and front-left,
 * front-right for stereo; a legacy header must carry no mask or SubFormat, and
 * an extensible one mask `0x4` or `0x3` and the PCM or float SubFormat GUID.
 * The processing must fold to one channel at 48 kHz with `[[1]]` or `[[0.5,
 * 0.5]]` and name the stage that the rates and channels imply.
 */
export const validWaveAudioIdentity: (
  asset: Extract<IAutoMovieProductionAudioAssetIdentity, { kind: "wave" }>,
) => boolean = (
  asset: Extract<IAutoMovieProductionAudioAssetIdentity, { kind: "wave" }>,
): boolean => {
  const source: IAutoMovieProductionWaveSourceFormat = asset.sourceFormat;
  const processing: IAutoMovieProductionAudioProcessing = asset.processing;
  const mono: boolean = asset.channels === 1;
  const expectedSpeakers: string[] = mono
    ? ["front-center"]
    : ["front-left", "front-right"];
  const expectedMatrix: number[][] = mono ? [[1]] : [[0.5, 0.5]];
  const resampled: boolean = asset.sampleRate !== MIX_SAMPLE_RATE;
  const expectedKind: IAutoMovieProductionAudioProcessing["kind"] = mono
    ? resampled
      ? "resample"
      : "copy"
    : resampled
      ? "downmix-resample"
      : "downmix";
  return (
    (asset.channels === 1 || asset.channels === 2) &&
    source.kind === "wave" &&
    source.sampleRate === asset.sampleRate &&
    source.channels === asset.channels &&
    (source.encoding === "pcm-s16le"
      ? source.containerBits === 16 && source.validBits === 16
      : source.encoding === "float-f32le" &&
        source.containerBits === 32 &&
        source.validBits === 32) &&
    source.layout.kind === (mono ? "mono" : "stereo") &&
    equalOrderedScalars(source.layout.speakers, expectedSpeakers) &&
    (source.layout.source === "legacy-default"
      ? source.header === "wave-format-ex" &&
        source.layout.mask === null &&
        source.subFormatGuid === null
      : source.layout.source === "channel-mask" &&
        source.header === "wave-format-extensible" &&
        source.layout.mask === (mono ? 0x4 : 0x3) &&
        source.subFormatGuid ===
          (source.encoding === "pcm-s16le"
            ? PCM_SUBFORMAT
            : FLOAT_SUBFORMAT)) &&
    processing.kind === expectedKind &&
    processing.outputChannels === 1 &&
    processing.outputSampleRate === MIX_SAMPLE_RATE &&
    equalOrderedScalarRows(processing.matrix, expectedMatrix)
  );
};

/*
 * Rate the decoder resamples to: the sound plan's fixed mix rate.
 */
const MIX_SAMPLE_RATE: IAutoMovieProductionSoundPlan["sampleRate"] = 48_000;

/*
 * KSDATAFORMAT_SUBTYPE_PCM, the SubFormat GUID of integer PCM.
 */
const PCM_SUBFORMAT: string = "00000001-0000-0010-8000-00aa00389b71";

/*
 * KSDATAFORMAT_SUBTYPE_IEEE_FLOAT, the SubFormat GUID of IEEE float.
 */
const FLOAT_SUBFORMAT: string = "00000003-0000-0010-8000-00aa00389b71";
