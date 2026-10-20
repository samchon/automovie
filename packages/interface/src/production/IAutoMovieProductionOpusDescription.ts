/**
 * Observed Opus dOps sample-entry facts from final delivery bytes; delivery-profile acceptance is checked separately.
 *
 * @evidence contracts/common.md#principled-implementation productionOpusDescription validates serialized field widths and channel-mapping relations against the parsed MP4 audio entry, retaining observed pre-skip, informational input rate and signed fixed-point gain.
 * @evidence contracts/common.md#clear-and-simple-design Separates codec facts from profile acceptance so a structurally valid non-delivery Opus entry can be reported accurately before the host rejects its unsupported profile.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Family zero has implied mono or stereo order and null stream counts; nonzero families keep their explicit mapping and null unexpanded speaker order rather than guessing channel meaning.
 * @evidence contracts/common.md#meaningful-documentation Defines observed codec fields, sample units, informational input rate, signed Q7.8 gain and family-dependent mapping nulls and arrays.
 */
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

  /** Informational original-input sample rate in hertz, independent of decoder output rate. */
  inputSampleRate: number;

  /** Parsed signed Q7.8 output gain. */
  outputGainQ7_8: number;

  /** Parsed mapping-family, stream, and channel-order facts. */
  channelMapping: {
    /** Serialized mapping-family code: zero, one or 255. */
    family: number;

    /** Serialized stream count, or null for family zero's implicit mapping. */
    streamCount: number | null;

    /** Coupled-stream count, or null for family zero. */
    coupledCount: number | null;

    /** Ordered decoded-channel indices, with 255 meaning silence; empty for family zero. */
    mapping: number[];

    /** Implied mono/stereo order for family zero; null when the parser does not expand speaker meaning. */
    channelOrder: string[] | null;
  };
}
