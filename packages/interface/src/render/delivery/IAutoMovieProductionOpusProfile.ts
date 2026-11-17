

/**
 * Required deterministic Opus-in-MP4 profile. AUTOMOVIE_PRODUCTION_OPUS_PROFILE supplies these fixed literals to assertProductionOpusProfile; observed preSkip remains in IAutoMovieProductionOpusDescription and is deliberately absent here. No wider parsed channel configuration is admitted by this required profile.
 *
 * @evidence contracts/development/design.md#principled-representation AUTOMOVIE_PRODUCTION_OPUS_PROFILE supplies these fixed literals to assertProductionOpusProfile; observed preSkip remains in IAutoMovieProductionOpusDescription and is deliberately absent here.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AUTOMOVIE_PRODUCTION_OPUS_PROFILE exchanges kind, version, outputChannelCount, inputSampleRate, outputGainQ7_8, channelMapping; their canonical owner is this contract and their concrete meanings are documented on the members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No wider parsed channel configuration is admitted by this required profile.
 * @evidence contracts/development/common.md#meaningful-documentation Required deterministic Opus-in-MP4 profile. The prose and members document how AUTOMOVIE_PRODUCTION_OPUS_PROFILE interprets and admits these values.
 */
export interface IAutoMovieProductionOpusProfile {
  /** Required codec discriminant. */
kind: "opus";
  /** Supported dOps version. */
version: 0;
  /** Required stereo channel count. */
outputChannelCount: 2;
  /** Declared input sample rate in samples per second; fixed at 48 kHz. */
inputSampleRate: 48000;
  /** Zero output gain in signed Q7.8 decibels. */
outputGainQ7_8: 0;
  /** Read-only family-zero stereo mapping; stream/coupled counts are absent in this family. */
channelMapping: Readonly<{
    /** Family zero selects implicit mono/stereo channel mapping. */
family: 0;
    /** No explicit stream count is encoded for family zero. */
streamCount: null;
    /** No explicit coupled-stream count is encoded for family zero. */
coupledCount: null;
    /** No explicit per-channel mapping bytes for family zero. */
mapping: readonly [];
    /** Output channel order is front-left followed by front-right. */
channelOrder: readonly ["front-left", "front-right"];
  }>;
}
