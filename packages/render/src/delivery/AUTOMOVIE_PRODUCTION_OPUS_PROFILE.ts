/** Current fieldwise Opus-in-MP4 profile written by the deterministic encoder. */
export const AUTOMOVIE_PRODUCTION_OPUS_PROFILE: Readonly<{
  kind: "opus";
  version: 0;
  outputChannelCount: 2;
  inputSampleRate: 48000;
  outputGainQ7_8: 0;
  channelMapping: Readonly<{
    family: 0;
    streamCount: null;
    coupledCount: null;
    mapping: readonly [];
    channelOrder: readonly ["front-left", "front-right"];
  }>;
}> = {
  kind: "opus",
  version: 0,
  outputChannelCount: 2,
  inputSampleRate: 48_000,
  outputGainQ7_8: 0,
  channelMapping: {
    family: 0,
    streamCount: null,
    coupledCount: null,
    mapping: [],
    channelOrder: ["front-left", "front-right"],
  },
} as const;
