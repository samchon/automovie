import type { IAutoMovieProductionAacDescription } from "./IAutoMovieProductionAacDescription";

/** Parser-observed MP4 audio track and presentation facts. */
export interface IAutoMovieProductionAudioProbe {
  /** Parsed media class. */
  kind: "audio";

  /** Parsed container family. */
  container: "mp4";

  /** Parsed codec string in RFC 6381 form, such as `mp4a.40.2` for AAC-LC. */
  codec: string;

  /** Parsed presentation runtime. */
  runtimeSeconds: number;

  /** Parsed channel count. */
  channels: number;

  /** Parsed media sample rate. */
  sampleRate: number;

  /** Parsed packet count. */
  sampleCount: number;

  /**
   * Decoder priming in samples: the media time of the track's single edit, or 0
   * without one.
   */
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

  /** The sample entry's AAC configuration, as its `esds` box declares it. */
  sampleEntry: IAutoMovieProductionAacDescription;
}
