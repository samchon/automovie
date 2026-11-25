import type { IAutoMovieProductionAudioProbe } from "@automovie/interface";

/**
 * An audio probe of the production profile: AAC-LC, 48 kHz, two channels, one
 * second, no edit.
 *
 * A test changes one field of the returned probe to separate the accepted file
 * from one refusal.
 */
export function createProductionAudioProbe(): IAutoMovieProductionAudioProbe {
  return {
    kind: "audio",
    container: "mp4",
    codec: "mp4a",
    runtimeSeconds: 1,
    channels: 2,
    sampleRate: 48_000,
    sampleCount: 47,
    primingSamples: 0,
    timebase: {
      movieTimescale: 1000,
      mediaTimescale: 48_000,
      movieDuration: 1000,
      mediaDuration: 48_000,
      edits: [],
    },
    sampleEntry: {
      codec: "mp4a",
      audioObjectType: 2,
      sampleRate: 48_000,
      channelCount: 2,
    },
  };
}