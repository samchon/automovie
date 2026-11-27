import type { IAutoMovieLoudnessIntent } from "../production/IAutoMovieLoudnessIntent.js";

/** Timing and content evidence from decoding one hashed delivery artifact. */
export namespace IAutoMovieDeliveryContentAudit {
  /**
   * Seconds per tick for timestamps, or frames per second for a frame rate.
   * Both terms are positive safe integers.
   */
  export type Ratio = readonly [numerator: number, denominator: number];

  /** A signed, safe integer tick count in the source clock. */
  export interface ITimestamp {
    /** Whole ticks since the stream's zero, as the decoder reports them. */
    ticks: number;
    /** Seconds per tick of the stream's own clock. */
    timeBase: Ratio;
  }

  /** The selected primary stream under inspection. */
  export type Media = "video" | "audio";

  /** Video luminance, repeated image content, or quiet decoded audio. */
  export type Detector = "black" | "frozen" | "silence";

  /**
   * A measured detector interval. A null end extends to the verified decoded
   * stream end.
   */
  export interface IObservation {
    /** The detector that reported the interval. */
    detector: Detector;
    /** The first decoded frame or sample inside the interval. */
    start: ITimestamp;
    /**
     * The first frame or sample after it, or null when it runs to the stream
     * end.
     */
    end: ITimestamp | null;
  }

  /**
   * An explicitly authored half-open film interval that allows a detector
   * condition.
   */
  export interface IAllowance {
    /** The condition the author allows. */
    detector: Detector;
    /** Inclusive film time where the allowance begins. */
    start: ITimestamp;
    /** Exclusive film time where it ends, no later than the film's end. */
    end: ITimestamp;
  }

  /**
   * Effective settings used to measure content. Pixel values, mean differences
   * and amplitude are ratios in [0, 1].
   */
  export interface IThresholds {
    /**
     * Shortest reported black interval, the share of the picture that must be
     * dark and the darkness level.
     */
    black: {
      minimumDuration: ITimestamp;
      minimumPictureRatio: number;
      maximumPixelThreshold: number;
    };
    /**
     * Shortest reported freeze and the largest mean picture change still
     * counted as unchanged.
     */
    frozen: {
      minimumDuration: ITimestamp;
      maximumMeanDifference: number;
    };
    /**
     * Shortest reported silence and the loudest amplitude still counted as
     * quiet on every channel.
     */
    silence: {
      minimumDuration: ITimestamp;
      maximumAmplitude: number;
    };
  }

  /**
   * Evidence from the host for the chosen stream. Continuity must be
   * established from the full decoded presentation grid or sample coverage. A
   * stream with incomplete evidence records the reason instead of supplying
   * inferred ends.
   */
  export type Stream =
    | { status: "missing" }
    | { status: "uncovered"; reason: string }
    | {
        status: "decoded";
        index: number;
        start: ITimestamp;
        end: ITimestamp;
        continuous: boolean;
        /** Decoded audio sample rate in Hz. Required for audio. */
        sampleRate?: number;
        /**
         * Decoded audio samples after the end the container presents, all
         * within the final codec frame. They are excluded from `end` and from
         * the observations.
         */
        trailingPadding?: number;
        /**
         * Audio only: BS.1770-5 integrated loudness in LUFS and true peak in
         * dBTP of the presented decoded samples, measured by engine's
         * `createAutoMovieLoudnessMeter`; each is null when the samples have
         * none. Absent when the host did not measure it.
         */
        loudness?: {
          integratedLufs: number | null;
          truePeakDbtp: number | null;
        };
        observations: readonly IObservation[];
      };

  /**
   * SHA-256 of the exact encoded file handed to the decoder and its identifying
   * filename.
   */
  export interface ISource {
    /** The decoded file's name, relative to the delivery folder. */
    file: string;
    /** Lowercase hexadecimal SHA-256 of the file's bytes. */
    sha256: string;
  }

  /**
   * Authored delivery obligations carried with the subject to the production
   * host.
   */
  export interface IIntent {
    /**
     * The selected production-root-relative soundtrack and its coverage
     * obligation.
     */
    audio?: { path: string | null; required: boolean };
    /** Explicitly approved black, frozen and silent ranges. */
    allowances?: readonly IAllowance[];
    /** Detector settings, when the production supplies its own policy. */
    thresholds?: IThresholds;
    /**
     * Loudness targets of the soundtrack. The render mixes a sound list to
     * them, or to EBU R 128 without them, and the delivery audit checks the
     * decoded delivered audio against the targets the mix applied, or against
     * these when the production supplies its own soundtrack.
     */
    loudness?: IAutoMovieLoudnessIntent;
  }

  /** The complete evidence and commissioned presentation for a single audit. */
  export interface IProps {
    /** The exact file the streams were decoded from. */
    source: ISource;
    /**
     * The commissioned clock and approval policy: frame count and rate, whether
     * sound is required, whether drawn intervals need an allowance, and the
     * authored allowances.
     */
    expected: {
      frameCount: number;
      frameRate: Ratio;
      audioRequired: boolean;
      /**
       * Whether an interval the drawn source also shows still needs an authored
       * allowance before delivery. Defaults to true; a production without
       * declared delivery intent passes false.
       */
      contentRequired?: boolean;
      allowances?: readonly IAllowance[];
      /**
       * Loudness targets the decoded audio must meet; absent, loudness and true
       * peak are reported with the stream but not checked. A decoded audio
       * stream without a `loudness` measurement then blocks.
       */
      loudness?: Pick<
        IAutoMovieLoudnessIntent,
        "integratedLufs" | "toleranceLu" | "maximumTruePeakDbtp"
      >;
    };
    /**
     * The detector settings both the delivery and the reference were measured
     * with.
     */
    thresholds: IThresholds;
    /** Decoded evidence of the delivered file's primary video and audio streams. */
    streams: Readonly<Record<Media, Stream>>;
    /**
     * The encoder's own inputs measured by the same detectors and thresholds:
     * the drawn frame sequence and the padded soundtrack. An interval they also
     * show was drawn rather than introduced by encoding. A medium without
     * complete reference evidence leaves its unallowed intervals unclassified.
     */
    reference?: Readonly<Partial<Record<Media, Stream>>>;
  }

  /**
   * How a measured interval relates to authorship: inside an authored
   * allowance, also present in the drawn source, introduced by encoding, or
   * without reference evidence to tell.
   */
  export type Outcome = "intentional" | "drawn" | "unexpected" | "unclassified";

  /**
   * A measured interval reconciled with authorship, or a failure to establish
   * stream coverage.
   */
  export type Finding =
    | {
        kind: "content";
        outcome: Outcome;
        blocking: boolean;
        media: Media;
        streamIndex: number;
        detector: Detector;
        start: ITimestamp;
        end: ITimestamp;
        /**
         * Delivery frame containing the start of a video finding. Audio uses
         * its own clock.
         */
        firstOutputFrame?: number;
      }
    | {
        kind:
          | "missing-stream"
          | "uncovered"
          | "timing-mismatch"
          | "invalid-observation";
        blocking: boolean;
        media: Media;
        streamIndex?: number;
        reason: string;
      }
    | {
        /** Integrated loudness outside the tolerance, or not measured. */
        kind: "loudness";
        blocking: true;
        media: "audio";
        streamIndex: number;
        /**
         * Measured LUFS, or null when no block passed the absolute gate or
         * nothing was measured.
         */
        measuredLufs: number | null;
        targetLufs: number;
        toleranceLu: number;
        reason: string;
      }
    | {
        /** True peak over the maximum. */
        kind: "true-peak";
        blocking: true;
        media: "audio";
        streamIndex: number;
        measuredDbtp: number;
        maximumDbtp: number;
        reason: string;
      };

  /**
   * Audit decision with the original evidence, effective thresholds and all
   * findings retained.
   */
  export interface IResult {
    /** The audited file, as supplied. */
    source: ISource;
    /** The commissioned clock and approval policy, as supplied. */
    expected: IProps["expected"];
    /** The detector settings the evidence was measured with. */
    thresholds: IThresholds;
    /** The delivered file's decoded evidence, as supplied. */
    streams: IProps["streams"];
    /** The reference measurement of the encoder's input, when supplied. */
    reference?: IProps["reference"];
    /** Every coverage and content finding, in stream and time order. */
    findings: Finding[];
    /** Whether no finding blocks delivery. */
    passed: boolean;
  }
}
