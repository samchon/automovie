/** Observed Opus sample-entry facts from final delivery bytes. */
export interface IAutoMovieProductionOpusDescription {
  /** Closed parsed sample-entry family. */
  kind: "opus";

  /**
   * Parsed dOps version.
   */
  version: number;

  /** Parsed output channel count. */
  outputChannelCount: number;

  /** Parsed decoder pre-skip in samples. */
  preSkip: number;

  /** Parsed input sample rate. */
  inputSampleRate: number;

  /** Parsed signed Q7.8 output gain. */
  outputGainQ7_8: number;

  /** Parsed mapping-family, stream, and channel-order facts. */
  channelMapping: {
    family: number;
    streamCount: number | null;
    coupledCount: number | null;
    mapping: number[];
    channelOrder: string[] | null;
  };
}
