/**
 * Timing and content evidence from decoding one hashed delivery artifact.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the native measurement, commissioned intent, reference measurement and findings that a delivery host passes to and receives from the pure audit.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps FFmpeg and file access out of the Interface and Render contract.
 * @evidence contracts/development/design.md#principled-representation Times are integer ticks on rational clocks, streams separate decoded evidence from missing or uncovered coverage, and findings keep authorship apart from coverage failures.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No floating-point second, inferred stream end or guessed authorship enters the contract; incomplete evidence is stated as such.
 */
export namespace IAutoMovieDeliveryContentAudit {
  /**
   * Seconds per tick for timestamps, or frames per second for a frame rate. Both terms are positive safe integers.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both uses and the integer domain.
   * @evidence contracts/development/design.md#principled-representation A rational pair keeps clocks and rates exact.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Shared by timestamps and the commissioned frame rate.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No floating-point rate replaces the pair.
   */
  export type Ratio = readonly [numerator: number, denominator: number];

  /**
   * A signed, safe integer tick count in the source clock.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the tick count and its clock.
   * @evidence contracts/development/design.md#principled-representation Integer ticks with their own time base locate an instant exactly in its stream.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, carried by observations, allowances, thresholds and streams.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Ticks are never converted to rounded seconds inside the contract.
   */
  export interface ITimestamp {
    /** Whole ticks since the stream's zero, as the decoder reports them. */
    ticks: number;
    /** Seconds per tick of the stream's own clock. */
    timeBase: Ratio;
  }

  /**
   * The selected primary stream under inspection.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the two media.
   * @evidence contracts/development/design.md#principled-representation A closed literal union keys the per-medium records.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only video and audio are audited.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No secondary stream is inspected under these names.
   */
  export type Media = "video" | "audio";

  /**
   * Video luminance, repeated image content, or quiet decoded audio.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names what each detector measures.
   * @evidence contracts/development/design.md#principled-representation A closed literal union names the three detectors the decode runs.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Shared by observations, allowances and findings.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No detector is implied by another; each reports its own intervals.
   */
  export type Detector = "black" | "frozen" | "silence";

  /**
   * A measured detector interval. A null end extends to the verified decoded stream end.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the detector, the half-open bounds and the meaning of a null end.
   * @evidence contracts/development/design.md#principled-representation A detector with a first-inside and first-after timestamp is a half-open interval on the stream clock.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, produced by the host decode and read by the audit.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A null end is used only up to a verified stream end, never for an unknown one.
   */
  export interface IObservation {
    /** The detector that reported the interval. */
    detector: Detector;
    /** The first decoded frame or sample inside the interval. */
    start: ITimestamp;
    /** The first frame or sample after it, or null when it runs to the stream end. */
    end: ITimestamp | null;
  }

  /**
   * An explicitly authored half-open film interval that allows a detector condition.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the detector and the inclusive and exclusive film bounds.
   * @evidence contracts/development/design.md#principled-representation A detector with half-open film-clock bounds, matching how observations are reconciled.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, carried by the intent and the commissioned expectation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Only explicit authored ranges allow a condition; nothing is allowed by default.
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
   * Effective settings used to measure content. Pixel values, mean differences and amplitude are ratios in [0, 1].
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each detector's settings and their units.
   * @evidence contracts/development/design.md#principled-representation Per-detector minimum durations in ticks with ratio thresholds in [0, 1].
   * @evidence contracts/development/design.md#minimal-and-owned-surface Exactly the settings the three detectors need, shared by the delivery and the reference measurement.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The delivery and the reference use the same thresholds, so their intervals compare directly.
   */
  export interface IThresholds {
    /** Shortest reported black interval, the share of the picture that must be dark and the darkness level. */
    black: {
      minimumDuration: ITimestamp;
      minimumPictureRatio: number;
      maximumPixelThreshold: number;
    };
    /** Shortest reported freeze and the largest mean picture change still counted as unchanged. */
    frozen: {
      minimumDuration: ITimestamp;
      maximumMeanDifference: number;
    };
    /** Shortest reported silence and the loudest amplitude still counted as quiet on every channel. */
    silence: {
      minimumDuration: ITimestamp;
      maximumAmplitude: number;
    };
  }

  /**
   * Evidence from the host for the chosen stream. Continuity must be established
   * from the full decoded presentation grid or sample coverage. A stream with
   * incomplete evidence records the reason instead of supplying inferred ends.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States how continuity is established, each status and the audio-only fields.
   * @evidence contracts/development/design.md#principled-representation A union discriminated by status separates a missing stream, uncovered evidence with its reason, and decoded evidence with its grid, clock and observations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Produced by the host decode for each medium and read by the audit.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Incomplete evidence never supplies inferred ends, and codec padding beyond the presented end is excluded from the stream.
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

  /**
   * SHA-256 of the exact encoded file handed to the decoder and its identifying filename.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the file and the digest format.
   * @evidence contracts/development/design.md#principled-representation A relative file name with the digest of its exact bytes identifies what was decoded.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, carried from the host into the result.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The digest is of the decoded bytes, not of an earlier candidate.
   */
  export interface ISource {
    /** The decoded file's name, relative to the delivery folder. */
    file: string;
    /** Lowercase hexadecimal SHA-256 of the file's bytes. */
    sha256: string;
  }

  /**
   * Authored delivery obligations carried with the subject to the production host.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the soundtrack obligation, the allowances and the optional thresholds.
   * @evidence contracts/development/design.md#principled-representation Optional authored obligations: the soundtrack and whether it is required, approved ranges and detector policy.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Supplied by the production with its subject and read by the delivery host.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An absent obligation is not inferred from the film.
   */
  export interface IIntent {
    /** The selected production-root-relative soundtrack and its coverage obligation. */
    audio?: { path: string | null; required: boolean };
    /** Explicitly approved black, frozen and silent ranges. */
    allowances?: readonly IAllowance[];
    /** Detector settings, when the production supplies its own policy. */
    thresholds?: IThresholds;
  }

  /**
   * The complete evidence and commissioned presentation for a single audit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the source, the commissioned expectation, the thresholds, the delivered streams and the optional reference.
   * @evidence contracts/development/design.md#principled-representation The decoded delivery, its commissioned clock and policy, and the encoder's own measured inputs are separate members.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Exactly what the pure audit reads, supplied by the delivery host.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An interval also present in the reference is classified drawn only with complete reference evidence.
   */
  export interface IProps {
    /** The exact file the streams were decoded from. */
    source: ISource;
    /**
     * The commissioned clock and approval policy: frame count and rate,
     * whether sound is required, whether drawn intervals need an allowance,
     * and the authored allowances.
     */
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
    /** The detector settings both the delivery and the reference were measured with. */
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the four outcomes.
   * @evidence contracts/development/design.md#principled-representation A closed literal union separates authored, drawn, encoder-introduced and undecidable intervals.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read only by content findings.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Without reference evidence an interval stays unclassified instead of being called drawn or introduced.
   */
  export type Outcome = "intentional" | "drawn" | "unexpected" | "unclassified";

  /**
   * A measured interval reconciled with authorship, or a failure to establish stream coverage.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names both finding kinds and their members.
   * @evidence contracts/development/design.md#principled-representation A union discriminated by kind separates content intervals with their outcome and clock from coverage failures with their reason.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Produced by the audit and returned in its result.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Each finding states whether it blocks; coverage failures never pass as content.
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

  /**
   * Audit decision with the original evidence, effective thresholds and all findings retained.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each retained input, the findings and the decision.
   * @evidence contracts/development/design.md#principled-representation The supplied evidence, the findings and one pass flag together let a reader recheck the decision.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by the audit to the delivery host and its report.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Every finding is retained, and the pass flag follows from the blocking ones.
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
