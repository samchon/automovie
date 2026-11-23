import type { IAutoMovieProductionOpusDescription } from "./IAutoMovieProductionOpusDescription";

/**
 * Parser-observed MP4 audio track and presentation facts.
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
