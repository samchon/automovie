import type {
  IAutoMovieProductionAacDescription,
  IAutoMovieProductionAudioProbe,
} from "@automovie/interface";

import { AutoMovieRenderProductionAacProfile } from "../AutoMovieRenderProductionAacProfile";

/*
 * Refuse a probed MP4 audio track that is not the AAC profile the delivery
 * encoder writes.
 *
 * The sample entry must be `mp4a` with an AudioSpecificConfig declaring AAC-LC,
 * 48,000 Hz and two channels, as `AutoMovieRenderProductionAacProfile` holds; the
 * sample entry's own channel count and rate and the track's media timescale
 * must agree with them; and the track must hold at least one coded sample.
 * Presentation timing is not checked here: the decoded delivery audit measures
 * what the track presents. The first difference, in that order, throws an
 * `Error` whose message starts with `unsupported-audio-profile.<field>` and
 * names the expected and observed values.
 * Parameter actual: The audio track facts a probe read from the file.
 */
export const assertProductionAacProfile: (
  actual: IAutoMovieProductionAudioProbe,
) => void = (actual: IAutoMovieProductionAudioProbe): void => {
  const entry: IAutoMovieProductionAacDescription = actual.sampleEntry;
  const comparisons: Array<[string, unknown, unknown]> = [
    ["codec", AutoMovieRenderProductionAacProfile.codec, entry.codec],
    [
      "audioObjectType",
      AutoMovieRenderProductionAacProfile.audioObjectType,
      entry.audioObjectType,
    ],
    [
      "sampleRate",
      AutoMovieRenderProductionAacProfile.sampleRate,
      entry.sampleRate,
    ],
    [
      "channelCount",
      AutoMovieRenderProductionAacProfile.channelCount,
      entry.channelCount,
    ],
    [
      "sampleEntry.channels",
      AutoMovieRenderProductionAacProfile.channelCount,
      actual.channels,
    ],
    [
      "sampleEntry.sampleRate",
      AutoMovieRenderProductionAacProfile.sampleRate,
      actual.sampleRate,
    ],
    [
      "timebase.mediaTimescale",
      AutoMovieRenderProductionAacProfile.sampleRate,
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
