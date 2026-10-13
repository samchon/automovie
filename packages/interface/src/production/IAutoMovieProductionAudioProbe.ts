import { IAutoMovieProductionOpusDescription } from "./IAutoMovieProductionOpusDescription";

/**
 * Parser-observed MP4 audio track and presentation facts.
 *
 * @evidence contracts/common.md#principled-implementation The rendered-media probe parses resident MP4 track tables, sample entry and edit list, deriving presentation runtime from movie duration and timescale and decoder priming from the Opus pre-skip.
 * @evidence contracts/common.md#clear-and-simple-design Separates convenient scalar audio facts from raw integer clocks and the complete codec entry so delivery checks can compare exact timebases and codec identity without reparsing bytes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Values come from parsed bytes rather than render-manifest claims; packet count is not PCM sample count, and priming is retained instead of folded silently into presentation duration.
 * @evidence contracts/common.md#meaningful-documentation Defines audio class, MP4 container, seconds, channels, sample rate, packet count, priming samples and movie versus media tick domains.
 * @author Samchon
 */
export interface IAutoMovieProductionAudioProbe {
  /** Parsed media class. */
  kind: "audio";

  /** Parsed container family. */
  container: "mp4";

  /** Parsed codec string. */
  codec: string;

  /** Parsed presentation runtime. */
  runtimeSeconds: number;

  /** Parsed channel count. */
  channels: number;

  /** Parsed media sample rate. */
  sampleRate: number;

  /** Parsed packet count. */
  sampleCount: number;

  /** Parsed decoder priming in samples. */
  primingSamples: number;

  /** Raw movie and media integer clocks. */
  timebase: {
    /** Movie presentation ticks per second. */
    movieTimescale: number;

    /** Audio media ticks per second. */
    mediaTimescale: number;

    /** Track presentation duration in movie ticks. */
    movieDuration: number;

    /** Encoded media duration in media ticks, including priming. */
    mediaDuration: number;

    /** Parsed edit-list entries in their resident order. */
    edits: Array<{
      /** Presentation segment length in movie ticks. */
      segmentDuration: number;

      /** Media start in media ticks; minus one denotes an empty edit. */
      mediaTime: number;

      /** Integer part of the signed fixed-point media rate. */
      mediaRateInteger: number;

      /** Fractional part of the fixed-point media rate. */
      mediaRateFraction: number;
    }>;
  };

  /** Complete parsed codec sample entry. */
  sampleEntry: IAutoMovieProductionOpusDescription;
}
