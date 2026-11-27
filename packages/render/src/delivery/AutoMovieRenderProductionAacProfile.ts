import type { IAutoMovieProductionAacProfile } from "@automovie/interface";

/**
 * The AAC-in-MP4 profile the delivery encoder writes: AAC-LC (audio object type
 * 2) at 48 kHz in two channels, the `-c:a aac -ar 48000 -ac 2` of
 * `planAutoMovieVideoEncoding`.
 */
export const AutoMovieRenderProductionAacProfile: Readonly<IAutoMovieProductionAacProfile> =
  {
    codec: "mp4a",
    audioObjectType: 2,
    sampleRate: 48_000,
    channelCount: 2,
  } as const;
