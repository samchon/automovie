import type {
  IAutoMovieProductionAudioProcessing,
  IAutoMovieProductionWaveSourceFormat,
} from "@automovie/ingest";
import type { IAutoMovieProductionSoundPlan } from "@automovie/interface";

import type { IAutoMovieProductionAudioAssetIdentity } from "./IAutoMovieProductionAudioAssetIdentity";
import { equalOrderedScalars } from "./equalOrderedScalars";

/** Rate the decoder resamples to: the sound plan's fixed mix rate. */
const MIX_SAMPLE_RATE: IAutoMovieProductionSoundPlan["sampleRate"] = 48_000;

/** KSDATAFORMAT_SUBTYPE_PCM, the SubFormat GUID of integer PCM. */
const PCM_SUBFORMAT: string = "00000001-0000-0010-8000-00aa00389b71";

/** KSDATAFORMAT_SUBTYPE_IEEE_FLOAT, the SubFormat GUID of IEEE float. */
const FLOAT_SUBFORMAT: string = "00000003-0000-0010-8000-00aa00389b71";

/**
 * Whether a WAVE asset's source format and processing record are exactly what
 * `decodeProductionAudioAsset` reports for a file of the asset's own rate and
 * channel count, decoded for the 48 kHz mix.
 *
 * The asset must be mono or stereo with source rate and channels equal to its
 * own. The encoding must be 16-bit PCM or 32-bit float in a container of the
 * same width; the speakers must be front-center for mono and front-left,
 * front-right for stereo; a legacy header must carry no mask or SubFormat, and
 * an extensible one mask `0x4` or `0x3` and the PCM or float SubFormat GUID.
 * The processing must fold to one channel at 48 kHz with `[[1]]` or
 * `[[0.5, 0.5]]` and name the stage that the rates and channels imply.
 *
 * @evidence contracts/common.md#principled-implementation Each relation restates a rule of the decoder's supported subset, the WAVEFORMATEXTENSIBLE speaker masks and the KSDATAFORMAT SubFormat GUIDs, so a record the decoder emitted for this rate and channel count passes and any edited field fails; ordered fields compare through `equalOrderedScalars` because channel order is meaningful.
 * @evidence contracts/common.md#clear-and-simple-design One boolean expression mirrors the decoder record field by field, with the expected stage, speakers and matrix derived first from the channel count and the rate, so the provenance-independent rules stay in `normalizeAudioAssets`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The constants are the Microsoft speaker masks and GUIDs and the mix rate typed from `IAutoMovieProductionSoundPlan`; no file or rate is special-cased, and the predicate returns false rather than repairing a field.
 * @evidence contracts/common.md#meaningful-documentation The doc names the decoder whose record this mirrors and lists every required relation for format, speakers, header and processing.
 * @evidence contracts/performance.md#efficient-algorithms The check does constant work: a fixed set of field comparisons and two ordered comparisons of at most two entries.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work `normalizeAudioAssets` calls it once per WAVE asset on that asset's own record, so there is no equivalent work to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The predicate retains nothing after returning a boolean and opens no handle or task.
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
    equalOrderedScalars(processing.matrix, expectedMatrix)
  );
};
