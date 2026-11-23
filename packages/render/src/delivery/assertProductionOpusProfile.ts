import type {
  IAutoMovieProductionAudioProbe,
  IAutoMovieProductionOpusDescription,
} from "@automovie/interface";

import { AUTOMOVIE_PRODUCTION_OPUS_PROFILE } from "./AUTOMOVIE_PRODUCTION_OPUS_PROFILE.js";

/**
 * Refuse every difference between a probed Opus-in-MP4 audio track and the one
 * profile the deterministic encoder writes.
 *
 * The codec, channel layout, 48 kHz rate and every `dOps` field must equal
 * `AUTOMOVIE_PRODUCTION_OPUS_PROFILE`, the `dOps` pre-skip must equal the
 * parsed priming, and the clocks must describe one full-rate edit that starts
 * at the pre-skip, presents a whole number of media samples, and is covered by
 * the coded samples. The reported runtime must equal movie duration over movie
 * timescale. The first difference, in the order above, throws an `Error`
 * whose message starts with `unsupported-audio-profile.<field>` and names the
 * expected and observed values.
 */
export const assertProductionOpusProfile: (
  actual: IAutoMovieProductionAudioProbe,
) => void = (actual: IAutoMovieProductionAudioProbe): void => {
  const description: IAutoMovieProductionOpusDescription = actual.sampleEntry;
  const edit:
    | IAutoMovieProductionAudioProbe["timebase"]["edits"][number]
    | undefined = actual.timebase.edits[0];
  const clockTerms: number[] = [
    actual.timebase.movieTimescale,
    actual.timebase.mediaTimescale,
    actual.timebase.movieDuration,
    actual.timebase.mediaDuration,
  ];
  const clocksSafe: boolean = clockTerms.every((value: number): boolean =>
    positiveSafeInteger(value),
  );
  const presentationNumerator: bigint = clocksSafe
    ? BigInt(actual.timebase.movieDuration) *
      BigInt(actual.timebase.mediaTimescale)
    : 0n;
  const presentationDenominator: bigint = clocksSafe
    ? BigInt(actual.timebase.movieTimescale)
    : 1n;
  const presentationQuotient: bigint =
    presentationNumerator / presentationDenominator;
  const presentationSamplesSafe: boolean =
    clocksSafe &&
    presentationNumerator % presentationDenominator === 0n &&
    presentationQuotient <= BigInt(Number.MAX_SAFE_INTEGER);
  const presentationSamples: number = Number(presentationQuotient);
  const comparisons: Array<[string, unknown, unknown]> = [
    [
      "codec",
      AUTOMOVIE_PRODUCTION_OPUS_PROFILE.kind,
      actual.codec.split(".")[0]!.toLowerCase(),
    ],
    [
      "channels",
      AUTOMOVIE_PRODUCTION_OPUS_PROFILE.outputChannelCount,
      actual.channels,
    ],
    [
      "sampleRate",
      AUTOMOVIE_PRODUCTION_OPUS_PROFILE.inputSampleRate,
      actual.sampleRate,
    ],
    ["sampleCount", true, actual.sampleCount > 0],
    [
      "dOps.version",
      AUTOMOVIE_PRODUCTION_OPUS_PROFILE.version,
      description.version,
    ],
    [
      "dOps.outputChannelCount",
      AUTOMOVIE_PRODUCTION_OPUS_PROFILE.outputChannelCount,
      description.outputChannelCount,
    ],
    [
      "dOps.inputSampleRate",
      AUTOMOVIE_PRODUCTION_OPUS_PROFILE.inputSampleRate,
      description.inputSampleRate,
    ],
    [
      "dOps.outputGainQ7_8",
      AUTOMOVIE_PRODUCTION_OPUS_PROFILE.outputGainQ7_8,
      description.outputGainQ7_8,
    ],
    [
      "dOps.channelMappingFamily",
      AUTOMOVIE_PRODUCTION_OPUS_PROFILE.channelMapping.family,
      description.channelMapping.family,
    ],
    [
      "dOps.streamCount",
      AUTOMOVIE_PRODUCTION_OPUS_PROFILE.channelMapping.streamCount,
      description.channelMapping.streamCount,
    ],
    [
      "dOps.coupledCount",
      AUTOMOVIE_PRODUCTION_OPUS_PROFILE.channelMapping.coupledCount,
      description.channelMapping.coupledCount,
    ],
    [
      "dOps.mapping",
      JSON.stringify(AUTOMOVIE_PRODUCTION_OPUS_PROFILE.channelMapping.mapping),
      JSON.stringify(description.channelMapping.mapping),
    ],
    [
      "dOps.channelOrder",
      JSON.stringify(
        AUTOMOVIE_PRODUCTION_OPUS_PROFILE.channelMapping.channelOrder,
      ),
      JSON.stringify(description.channelMapping.channelOrder),
    ],
    ["dOps.preSkip", actual.primingSamples, description.preSkip],
    [
      "timebase.movieTimescale",
      true,
      positiveSafeInteger(actual.timebase.movieTimescale),
    ],
    [
      "timebase.mediaTimescale",
      AUTOMOVIE_PRODUCTION_OPUS_PROFILE.inputSampleRate,
      actual.timebase.mediaTimescale,
    ],
    [
      "timebase.movieDuration",
      true,
      positiveSafeInteger(actual.timebase.movieDuration),
    ],
    [
      "timebase.mediaDuration",
      true,
      positiveSafeInteger(actual.timebase.mediaDuration),
    ],
    ["timebase.edits.length", 1, actual.timebase.edits.length],
    [
      "timebase.edit.segmentDuration",
      actual.timebase.movieDuration,
      edit?.segmentDuration,
    ],
    ["timebase.edit.mediaTime", description.preSkip, edit?.mediaTime],
    ["timebase.edit.mediaRateInteger", 1, edit?.mediaRateInteger],
    ["timebase.edit.mediaRateFraction", 0, edit?.mediaRateFraction],
    ["timebase.presentationSamples", true, presentationSamplesSafe],
    [
      "timebase.codedCoverage",
      true,
      presentationSamplesSafe &&
        actual.timebase.mediaDuration >=
          description.preSkip + presentationSamples,
    ],
    [
      "runtimeSeconds",
      actual.timebase.movieDuration / actual.timebase.movieTimescale,
      actual.runtimeSeconds,
    ],
  ];
  const mismatch: [string, unknown, unknown] | undefined = comparisons.find(
    ([, expected, observed]: [string, unknown, unknown]): boolean =>
      expected !== observed,
  );
  if (mismatch !== undefined)
    throw new Error(
      `unsupported-audio-profile.${mismatch[0]}: expected ${String(mismatch[1])}, observed ${String(mismatch[2])}.`,
    );
};

const positiveSafeInteger: (value: number) => boolean = (
  value: number,
): boolean => Number.isSafeInteger(value) && value > 0;
