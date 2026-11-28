/**
 * What a capture of a video file records about the file: its path, the
 * threshold its cuts were detected at, and every cut with its score.
 *
 * The capture request parser admits the threshold on the 0 to 100 scdet scale;
 * the report reader requires finite cut seconds and scores. The source path is
 * descriptive text, not a file handle or permission to read it.
 */
export interface IAutoMovieCaptureVideoSource {
  /** Path of the video file. */
  file: string;

  /** `scdet` score at which a frame started a new scene. */
  threshold: number;

  /** Every detected cut: the second its new scene starts and its score. */
  cuts: {
    /** Video-local second of the first frame after the detected cut. */
    seconds: number;

    /** FFmpeg scdet change score on its 0 to 100 scale. */
    score: number;
  }[];

  /** Exact evidence from the selected picture extraction when the host supplied it. */
  presentation?: IAutoMovieCaptureVideoSource.Presentation;
}

export namespace IAutoMovieCaptureVideoSource {
  /** Exact decoder observations or the reason the host could supply only estimated times. */
  export type Presentation = IDecoded | IUnavailable;

  /** Presentation ticks from the same stream and extraction that produced the stills. */
  export interface IDecoded {
    /** The extraction confirmed the stream and every requested frame clock. */
    readonly type: "decoded";

    /** SHA-256 of the encoded input bytes, lowercase hexadecimal. */
    readonly fileSha256: string;

    /** Absolute stream index in the first FFmpeg input. */
    readonly streamIndex: number;

    /** Positive integer numerator and denominator, in seconds per tick. */
    readonly timeBase: readonly [number, number];

    /** Selected pictures in decoded order, before any resizing or stamping. */
    readonly frames: readonly IFrame[];
  }

  /** Why the current capture can supply only its estimated sampling clock. */
  export interface IUnavailable {
    /** The extraction did not supply a complete exact clock. */
    readonly type: "unavailable";

    /** The first refused stream or frame-clock condition. */
    readonly reason: string;
  }

  /** One observed presentation timestamp. */
  export interface IFrame {
    /** Zero-based decoded frame index on the identified stream. */
    readonly frame: number;

    /** Signed presentation ticks in the parent record's time base. */
    readonly ticks: number;
  }
}
