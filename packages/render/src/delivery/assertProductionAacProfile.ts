import type {
  IAutoMovieProductionAacDescription,
  IAutoMovieProductionAudioProbe,
} from "@automovie/interface";

import { AUTOMOVIE_PRODUCTION_AAC_PROFILE } from "./AUTOMOVIE_PRODUCTION_AAC_PROFILE.js";

/**
 * Refuse a probed MP4 audio track that is not the AAC profile the delivery
 * encoder writes.
 *
 * The sample entry must be `mp4a` with an AudioSpecificConfig declaring AAC-LC,
 * 48,000 Hz and two channels, as `AUTOMOVIE_PRODUCTION_AAC_PROFILE` holds; the
 * sample entry's own channel count and rate and the track's media timescale
 * must agree with them; and the track must hold at least one coded sample.
 * Presentation timing is not checked here: the decoded delivery audit measures
 * what the track presents. The first difference, in that order, throws an
 * `Error` whose message starts with `unsupported-audio-profile.<field>` and
 * names the expected and observed values.
 *
 * @param actual The audio track facts a probe read from the file.
 */
export const assertProductionAacProfile: (
  actual: IAutoMovieProductionAudioProbe,
) => void = (actual: IAutoMovieProductionAudioProbe): void => {
  const entry: IAutoMovieProductionAacDescription = actual.sampleEntry;
  const comparisons: Array<[string, unknown, unknown]> = [
    ["codec", AUTOMOVIE_PRODUCTION_AAC_PROFILE.codec, entry.codec],
    [
      "audioObjectType",
      AUTOMOVIE_PRODUCTION_AAC_PROFILE.audioObjectType,
      entry.audioObjectType,
    ],
    [
      "sampleRate",
      AUTOMOVIE_PRODUCTION_AAC_PROFILE.sampleRate,
      entry.sampleRate,
    ],
    [
      "channelCount",
      AUTOMOVIE_PRODUCTION_AAC_PROFILE.channelCount,
      entry.channelCount,
    ],
    [
      "sampleEntry.channels",
      AUTOMOVIE_PRODUCTION_AAC_PROFILE.channelCount,
      actual.channels,
    ],
    [
      "sampleEntry.sampleRate",
      AUTOMOVIE_PRODUCTION_AAC_PROFILE.sampleRate,
      actual.sampleRate,
    ],
    [
      "timebase.mediaTimescale",
      AUTOMOVIE_PRODUCTION_AAC_PROFILE.sampleRate,
      actual.timebase.mediaTimescale,
    ],
    ["sampleCount", true, actual.sampleCount > 0],
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
