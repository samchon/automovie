/**
 * A production subject and its authored verification criteria. A subject can
 * address a whole delivery or a local model, motion or shot check.
 *
 * Keep the expected behavior and any scoped exception beside the authored
 * criterion. The status reader evaluates available evidence. An explicit run
 * executes selected measurement callbacks and configured capture refreshes.
 */
export interface IAutoMovieProductionCheck {
  /**
   * Nonblank stable subject key within the production. It selects the subject
   * and keys retained local receipt paths with each check ID.
   */
  readonly id: string;

  /**
   * Authored criterion list in report order. Check IDs are unique within this
   * subject.
   */
  readonly checks: readonly IAutoMovieProductionCheck.Check[];

  /**
   * Optional stage-name map of required check IDs. The runner reports a
   * required row even when the criterion is filtered out, disabled or removed.
   *
   * A requested stage must have a nonempty list of named requirements. Removing
   * a criterion from the check list leaves its required row blocked.
   */
  readonly required?: Readonly<Record<string, readonly string[]>>;
}

/** Authored production check variants and the current observation report. */
export namespace IAutoMovieProductionCheck {
  /**
   * A scalar criterion evaluated by project code under explicit input-byte
   * tracking.
   *
   * A retained numeric receipt is checked again against the current criterion
   * and exact input bytes. If those inputs change during measurement, the run
   * reports stale without replacing its receipt.
   */
  export interface IMeasurement extends IBase {
    /**
     * Routes to local measurement execution for an explicit run, or to the
     * matching retained receipt during a status read.
     */
    readonly kind: "measure";

    /**
     * Optional project-relative defining module used as the root of the loaded
     * source graph. The CLI uses the loaded check entry when omitted.
     */
    readonly source?: string;

    /**
     * Explicit project-relative files affecting the result. A nested production
     * can name shared files whose resolved destinations remain within its
     * owning checkout.
     *
     * Use the smallest complete set, including code or data omitted from the
     * loaded source graph. The runner checks the named path and its actual
     * filesystem destination.
     */
    readonly inputs: readonly string[];

    /** Nonblank unit shared by the observed number and all supplied limits. */
    readonly unit: string;

    /**
     * Optional finite inclusive lower bound in the observation unit. When both
     * bounds are present, this cannot exceed the upper bound.
     */
    readonly minimum?: number;

    /**
     * Optional finite inclusive upper bound in the observation unit. Supply at
     * least one of the two limits.
     */
    readonly maximum?: number;

    /**
     * Synchronous or asynchronous callback receiving the production root and
     * returning the finite observed number. Keep the declared inputs unchanged
     * during execution.
     *
     * The callback is trusted production code and can use the project root. The
     * checker validates numeric bounds against the returned measurement.
     */
    readonly measure: (root: string) => number | Promise<number>;
  }

  /**
   * Criterion for existing drawn diagnostic coverage in a selected capture
   * subject, view, pass and time scope.
   *
   * An interval needs coverage for every selected output frame. Mixed view or
   * pass cells in a selected scope make the aggregate audit insufficient.
   * Confirmed errors at requested times fail the criterion, while ambiguous
   * findings require a scoped retake.
   */
  export interface ICapture extends IBase {
    /**
     * Routes to capture record evaluation and, when configured for an explicit
     * run, capture refresh.
     */
    readonly kind: "capture";

    /**
     * Project-relative capture record path. The checker uses its directory to
     * find retained stills and verifies refreshed record bytes.
     */
    readonly record: string;

    /**
     * Exact subject identity recorded by the capture. A different capture
     * subject cannot satisfy this criterion.
     */
    readonly subject: string;

    /**
     * Optional tokens for refreshing the record through the capture command on
     * an explicit run. Omission reads the existing record.
     */
    readonly capture?: readonly string[];

    /**
     * For an explicit capture refresh, supply at least one project-relative
     * input. The resulting receipt binds the declared input bytes and the
     * captured record bytes.
     *
     * With inputs omitted, status can use a legacy record without a scoped
     * receipt when the production is the checkout root and the record's
     * revision matches the current revision exactly.
     */
    readonly inputs?: readonly string[];

    /** Required view identity on every captured cell at the selected time scope. */
    readonly view: string;

    /** Required pass identity on every captured cell at the selected time scope. */
    readonly pass: string;

    /**
     * Inspection continuity scope used to select coverage ranges and reported
     * finding episodes.
     */
    readonly occurrence: string;

    /**
     * Exact diagnostic check and checker-owned key to match against coverage,
     * episodes and unmatched audit entries.
     */
    readonly diagnostic: ICaptureDiagnostic;

    /**
     * Choose an exact continuous instant or a half-open interval of output
     * frame ordinals. Each requested sample needs a drawn cell, checked
     * coverage and matching still bytes.
     *
     * Pass a discriminated selection. A still addresses a single time and
     * consecutive frames require every output-frame ordinal.
     */
    readonly at: ICaptureTime;
  }

  /** Two identifiers used together to select one capture diagnostic observation. */
  export type ICaptureDiagnostic = {
    /** Diagnostic check name emitted by the inspection owner. */
    readonly check: string;
    /**
     * Checker-defined subject identity for that diagnostic within the selected
     * occurrence.
     */
    readonly key: string;
  };

  /**
   * Discriminated capture time selection for exactly one continuous second
   * value or one frame interval.
   */
  export type ICaptureTime = ICaptureSecond | ICaptureFrames;

  /**
   * Select one finite instant on the capture subject's continuous seconds
   * clock.
   */
  export interface ICaptureSecond {
    /** Choose exact equality on the capture subject's continuous clock. */
    readonly type: "second";

    /**
     * Finite nonnegative subject seconds. An off-grid still can address this
     * instant.
     */
    readonly second: number;

    /** Leave the output frame start unset for a seconds selection. */
    readonly fromFrame?: never;

    /** Leave the output frame end unset for a seconds selection. */
    readonly endFrame?: never;
  }

  /** Select every consecutive output frame within a nonempty half-open interval. */
  export interface ICaptureFrames {
    /**
     * Choose a range of output-frame ordinals with inclusive start and
     * exclusive end.
     */
    readonly type: "frames";

    /** First required output frame, a nonnegative safe integer. */
    readonly fromFrame: number;

    /**
     * Exclusive output frame end, a safe integer strictly greater than the
     * start.
     */
    readonly endFrame: number;

    /** Leave the continuous seconds field unset for a frame interval. */
    readonly second?: never;
  }

  /**
   * Criterion binding the latest published movie to its render report and
   * optional control receipts.
   *
   * A failed latest rendering cannot be satisfied by an earlier output in the
   * same directory. Verify transferred control image bytes against the frame
   * digests when required by the recipient.
   */
  export interface IDelivery extends IBase {
    /** Routes to inspection of publication and retained control metadata. */
    readonly kind: "delivery";

    /**
     * Expected render subject in both the latest render report and any required
     * control record.
     */
    readonly subject: string;

    /**
     * Project-relative latest render report. The checker finds the published
     * video beside it using the video's recorded basename.
     */
    readonly report: string;

    /**
     * Optional required control passes in the adjacent control record. The
     * checker requires matching subject, movie digest, frame clock and per-pass
     * ordered digest contents.
     */
    readonly controls?: readonly string[];
  }

  /**
   * Criterion requiring a recorded observation of specific current delivered
   * bytes over a frame interval.
   *
   * The receipt must report a named reviewer, the requested activity and a
   * decision. Playback and listening also require a continuous reported time
   * span covering the full requested frame range.
   */
  export interface IReview extends IBase {
    /**
     * Routes to verification of an existing review receipt and its referenced
     * video bytes.
     */
    readonly kind: "review";

    /** Project-relative observation file to read for the named review. */
    readonly observation: string;

    /**
     * Project-relative video path whose current bytes must match the review
     * receipt.
     */
    readonly file: string;

    /** Expected render subject in the review observation. */
    readonly subject: string;

    /**
     * Required activity, matched exactly to still, playback or listening in the
     * observation.
     */
    readonly viewed: "still" | "playback" | "listening";

    /**
     * Required frame interval using zero-based start and exclusive end. Still
     * review can satisfy one frame.
     */
    readonly frames: IReviewFrames;

    /**
     * Optional cut occurrence that must match the receipt's resolved edit entry
     * ordinal and shot ID.
     */
    readonly occurrence?: IReviewOccurrence;
  }

  /** Nonempty half-open interval of output frames for a review criterion. */
  export interface IReviewFrames {
    /** Nonnegative safe-integer first required output frame, inclusive. */
    readonly fromFrame: number;

    /** Safe-integer exclusive end greater than the first required frame. */
    readonly endFrame: number;
  }

  /** Exact edit entry and shot pair for a review tied to a source occurrence. */
  export type IReviewOccurrence = {
    /** Zero-based edit entry ordinal the observation must identify. */
    readonly entry: number;
    /** Exact shot ID that must match the resolved cut occurrence. */
    readonly shot: string;
  };

  /**
   * Supported authored criterion union covering scalar measurement and three
   * retained artifact observations.
   */
  export type Check = IMeasurement | ICapture | IDelivery | IReview;

  /**
   * Current scoped criterion outcome with stage membership and an owning
   * artifact link when available.
   */
  export interface IResult {
    /** ID of the production subject selected for this criterion. */
    readonly target: string;

    /**
     * Criterion ID within the subject. A removed required check retains its
     * requested ID.
     */
    readonly id: string;

    /**
     * Authored expectation shown to the director. A removed required definition
     * uses its ID.
     */
    readonly title: string;

    /**
     * Authored criterion scope for a part, view, time or case. A removed
     * required definition carries the requested stage.
     */
    readonly scope: string;

    /**
     * Current result distinguished as passed, failed, not-run, unobserved,
     * stale, disabled or awaiting-review.
     *
     * Passed and failed report a decisive current condition. Not-run means the
     * required operation or receipt is missing. Unobserved means existing
     * evidence cannot establish the criterion. Stale means evidence identity
     * changed. Disabled reflects configuration. Awaiting-review requests the
     * matching human observation.
     */
    readonly state:
      | "passed"
      | "failed"
      | "not-run"
      | "unobserved"
      | "stale"
      | "disabled"
      | "awaiting-review";

    /**
     * Observed value, decisive failure or next evidence action in the current
     * scope.
     */
    readonly message: string;

    /**
     * Optional project-relative receipt, capture, delivery or review record
     * path supporting the reported state.
     */
    readonly evidence?: string;

    /** Whether the requested stage names this criterion as required. */
    readonly required: boolean;
  }

  /**
   * Selection-ordered production check results and the current requested-stage
   * verdict.
   *
   * Filtering controls which checks execute. Required but unselected criteria
   * still appear and use current available evidence.
   */
  export interface IReport {
    /** Selected subject IDs in request order with repeated requests collapsed. */
    readonly targets: readonly string[];

    /** Requested stage name or null for an ordinary status or run. */
    readonly requiredStage: string | null;

    /**
     * Report rows in subject and check order, including all required rows even
     * when filtered or missing.
     */
    readonly items: readonly IResult[];

    /**
     * True when any requested-stage criterion has a state other than passed. An
     * ordinary status read has no blocking stage.
     */
    readonly blocked: boolean;
  }

  /** Metadata shared by the authored measurement and retained receipt criteria. */
  interface IBase {
    /** Stable nonblank criterion key, unique among the subject's checks. */
    readonly id: string;

    /** Nonblank director-facing expectation for this criterion. */
    readonly title: string;

    /**
     * Nonblank label identifying the condition, part, view or time being
     * inspected.
     */
    readonly scope: string;

    /**
     * False preserves the criterion in the report but withholds execution.
     * Disabled required work still blocks the stage.
     */
    readonly enabled?: boolean;
  }
}
