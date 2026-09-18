/**
 * Observed Opus sample-entry facts from final delivery bytes.
 *
 * @evidence requirements/delivery-and-accessibility/audio-streams-and-channels.md#delivery-channel-layout Preserves the coded channel count, mapping family, coupling, and channel order the final Opus stream declares.
 * @evidence specifications/editorial-render-and-delivery/delivery-profiles-time-and-picture.md#spec-delivery-container-media-facts Carries parser-observed codec configuration for fieldwise comparison with the selected delivery profile.
 */
export interface IAutoMovieProductionOpusDescription {
  /**
   * Closed parsed sample-entry family.
   * @evidence requirements/delivery-and-accessibility/containers-codecs-and-media-facts.md#delivery-supported-combinations Identifies the Opus sample-entry family the delivery profile's supported codec subset is checked against.
   * @evidence specifications/editorial-render-and-delivery/delivery-profiles-time-and-picture.md#spec-delivery-container-media-facts Supplies the parsed sample-entry kind.
   */
  kind: "opus";
  /**
   * Parsed dOps version.
   */
  version: number;
  /**
   * Parsed output channel count.
   * @evidence requirements/delivery-and-accessibility/audio-streams-and-channels.md#delivery-channel-layout Preserves the coded channel population.
   * @evidence specifications/editorial-render-and-delivery/delivery-profiles-time-and-picture.md#spec-delivery-container-media-facts Supplies the sample-entry channel count.
   */
  outputChannelCount: number;
  /**
   * Parsed decoder pre-skip in samples.
   * @evidence requirements/delivery-and-accessibility/audio-streams-and-channels.md#delivery-audio-sample-boundary Preserves the coded priming boundary that offsets the first audible sample.
   * @evidence specifications/editorial-render-and-delivery/delivery-profiles-time-and-picture.md#spec-delivery-container-media-facts Supplies the parsed pre-skip.
   */
  preSkip: number;
  /**
   * Parsed input sample rate.
   * @evidence requirements/delivery-and-accessibility/audio-streams-and-channels.md#delivery-audio-sample-boundary Preserves the Opus input clock that converts sample counts into presentation time.
   * @evidence specifications/editorial-render-and-delivery/delivery-profiles-time-and-picture.md#spec-delivery-container-media-facts Supplies the sample-entry rate.
   */
  inputSampleRate: number;
  /**
   * Parsed signed Q7.8 output gain.
   * @evidence requirements/delivery-and-accessibility/audio-streams-and-channels.md#delivery-audio-downmix Prevents hidden final-stream gain changes.
   * @evidence specifications/editorial-render-and-delivery/delivery-profiles-time-and-picture.md#spec-delivery-container-media-facts Supplies the parsed Opus gain.
   */
  outputGainQ7_8: number;
  /**
   * Parsed mapping-family, stream, and channel-order facts.
   * @evidence requirements/delivery-and-accessibility/audio-streams-and-channels.md#delivery-channel-layout Preserves the complete coded channel mapping.
   * @evidence specifications/editorial-render-and-delivery/delivery-profiles-time-and-picture.md#spec-delivery-container-media-facts Supplies the parsed mapping structure.
   */
  channelMapping: {
    family: number;
    streamCount: number | null;
    coupledCount: number | null;
    mapping: number[];
    channelOrder: string[] | null;
  };
}
