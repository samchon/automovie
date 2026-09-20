import { IAutoMovieProductionOpusDescription } from "./IAutoMovieProductionOpusDescription";

/**
 * Parser-observed audio track and presentation facts.
 *
 * @evidence requirements/delivery-and-accessibility/audio-streams-and-channels.md#delivery-channel-layout Makes final channel layout and sample-clock identity inspectable from the published stream.
 * @evidence specifications/simulation-effects-and-sound/mix-stems-loudness-and-av-join.md#sound-delivery-stream-and-inventory Binds the final audio inventory to its actual timebase, samples, and codec description.
 */
export interface IAutoMovieProductionAudioProbe {
  /**
   * Parsed media class.
   * @evidence requirements/delivery-and-accessibility/containers-codecs-and-media-facts.md#delivery-supported-combinations Identifies one final audio track within the delivered container and codec combination.
   * @evidence specifications/simulation-effects-and-sound/mix-stems-loudness-and-av-join.md#sound-delivery-stream-and-inventory Supplies the audio inventory kind.
   */
  kind: "audio";

  /**
   * Parsed container family.
   * @evidence requirements/delivery-and-accessibility/containers-codecs-and-media-facts.md#delivery-supported-combinations Preserves the observed container family of the final audio stream.
   * @evidence specifications/simulation-effects-and-sound/mix-stems-loudness-and-av-join.md#sound-delivery-stream-and-inventory Supplies the audio inventory container.
   */
  container: "mp4";

  /**
   * Parsed codec string.
   * @evidence requirements/delivery-and-accessibility/containers-codecs-and-media-facts.md#delivery-supported-combinations Preserves the observed codec of the final audio stream.
   * @evidence specifications/simulation-effects-and-sound/mix-stems-loudness-and-av-join.md#sound-delivery-stream-and-inventory Supplies the audio inventory codec.
   */
  codec: string;

  /**
   * Parsed presentation runtime.
   * @evidence requirements/delivery-and-accessibility/containers-codecs-and-media-facts.md#delivery-stream-duration-interleave Preserves the observed presentation duration of the final audio stream.
   * @evidence specifications/simulation-effects-and-sound/mix-stems-loudness-and-av-join.md#audio-visual-duration-and-timebase-join Supplies the audio side of the duration join.
   */
  runtimeSeconds: number;

  /**
   * Parsed channel count.
   * @evidence requirements/delivery-and-accessibility/audio-streams-and-channels.md#delivery-channel-layout Preserves the actual final channel population.
   * @evidence specifications/simulation-effects-and-sound/mix-stems-loudness-and-av-join.md#sound-delivery-stream-and-inventory Supplies the final channel count.
   */
  channels: number;

  /**
   * Parsed media sample rate.
   * @evidence requirements/delivery-and-accessibility/audio-streams-and-channels.md#delivery-audio-sample-boundary Preserves the final audio clock every sample count is measured against.
   * @evidence specifications/simulation-effects-and-sound/mix-stems-loudness-and-av-join.md#sound-delivery-stream-and-inventory Supplies the final sample rate.
   */
  sampleRate: number;

  /**
   * Parsed packet count.
   * @evidence requirements/delivery-and-accessibility/audio-streams-and-channels.md#delivery-audio-sample-boundary Proves the exact resident coded sample count of the final track.
   * @evidence specifications/simulation-effects-and-sound/mix-stems-loudness-and-av-join.md#sound-delivery-stream-and-inventory Supplies the coded packet population.
   */
  sampleCount: number;

  /**
   * Parsed decoder priming in samples.
   * @evidence requirements/delivery-and-accessibility/containers-codecs-and-media-facts.md#delivery-stream-duration-interleave Preserves the observed priming-like presentation offset of the final audio stream.
   * @evidence specifications/simulation-effects-and-sound/mix-stems-loudness-and-av-join.md#audio-visual-duration-and-timebase-join Supplies the audio priming fact.
   */
  primingSamples: number;

  /**
   * Raw movie and media integer clocks.
   * @evidence requirements/delivery-and-accessibility/frame-rate-timebase-and-timecode.md#delivery-stream-synchronization Preserves exact presentation and media timebases.
   * @evidence specifications/simulation-effects-and-sound/mix-stems-loudness-and-av-join.md#audio-visual-duration-and-timebase-join Supplies the integer audio clock join.
   */
  timebase: {
    movieTimescale: number;
    mediaTimescale: number;
    movieDuration: number;
    mediaDuration: number;
    edits: Array<{
      segmentDuration: number;
      mediaTime: number;
      mediaRateInteger: number;
      mediaRateFraction: number;
    }>;
  };

  /**
   * Complete parsed codec sample entry.
   * @evidence requirements/delivery-and-accessibility/audio-streams-and-channels.md#delivery-channel-layout Preserves channel mapping and gain beside track facts.
   * @evidence specifications/simulation-effects-and-sound/mix-stems-loudness-and-av-join.md#sound-delivery-stream-and-inventory Supplies the final codec description.
   */
  sampleEntry: IAutoMovieProductionOpusDescription;
}
