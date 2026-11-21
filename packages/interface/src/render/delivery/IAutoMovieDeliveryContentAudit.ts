/**
 * Timing and content evidence from decoding one hashed delivery artifact.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the native measurement, commissioned intent, and findings that a delivery host passes to and receives from the pure audit.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps FFmpeg and file access out of the Interface and Render contract.
 */
export namespace IAutoMovieDeliveryContentAudit {
  /** Seconds per tick for timestamps, or frames per second for a frame rate. Both terms are positive safe integers. */
  export type Ratio = readonly [numerator: number, denominator: number];

  /** A signed, safe integer tick count in the source clock. */
  export interface ITimestamp {
    ticks: number;
    timeBase: Ratio;
  }

  /** The selected primary stream under inspection. */
  export type Media = "video" | "audio";

  /** Video luminance, repeated image content, or quiet decoded audio. */
  export type Detector = "black" | "frozen" | "silence";

  /** A measured detector interval. A null end extends to the verified decoded stream end. */
  export interface IObservation {
    detector: Detector;
    start: ITimestamp;
    end: ITimestamp | null;
  }

  /** An explicitly authored half-open film interval that allows a detector condition. */
  export interface IAllowance {
    detector: Detector;
    start: ITimestamp;
    end: ITimestamp;
  }

  /** Effective settings used to measure content. Pixel values, mean differences and amplitude are ratios in [0, 1]. */
  export interface IThresholds {
    black: {
      minimumDuration: ITimestamp;
      minimumPictureRatio: number;
      maximumPixelThreshold: number;
    };
    frozen: {
      minimumDuration: ITimestamp;
      maximumMeanDifference: number;
    };
    silence: {
      minimumDuration: ITimestamp;
      maximumAmplitude: number;
    };
  }

  /**
   * Evidence from the host for the chosen stream. Continuity must be established
   * from the full decoded presentation grid or sample coverage. A stream with
   * incomplete evidence records the reason instead of supplying inferred ends.
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
        observations: readonly IObservation[];
      };

  /** SHA-256 of the exact encoded file handed to the decoder and its identifying filename. */
  export interface ISource {
    file: string;
    sha256: string;
  }

  /** Authored delivery obligations carried with the subject to the production host. */
  export interface IIntent {
    /** The selected production-root-relative soundtrack and its coverage obligation. */
    audio?: { path: string | null; required: boolean };
    /** Explicitly approved black, frozen and silent ranges. */
    allowances?: readonly IAllowance[];
    /** Detector settings, when the production supplies its own policy. */
    thresholds?: IThresholds;
  }

  /** The complete evidence and commissioned presentation for a single audit. */
  export interface IProps {
    source: ISource;
    expected: {
      frameCount: number;
      frameRate: Ratio;
      audioRequired: boolean;
      /**
       * Whether an interval the drawn source also shows still needs an
       * authored allowance before delivery. Defaults to true; a production
       * without declared delivery intent passes false.
       */
      contentRequired?: boolean;
      allowances?: readonly IAllowance[];
    };
    thresholds: IThresholds;
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

  /** A measured interval reconciled with authorship, or a failure to establish stream coverage. */
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
        /** Delivery frame containing the start of a video finding. Audio uses its own clock. */
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
      };

  /** Audit decision with the original evidence, effective thresholds and all findings retained. */
  export interface IResult {
    source: ISource;
    expected: IProps["expected"];
    thresholds: IThresholds;
    streams: IProps["streams"];
    reference?: IProps["reference"];
    findings: Finding[];
    passed: boolean;
  }
}
