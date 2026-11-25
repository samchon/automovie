/**
 * An editable, named subject and the verification criteria used on it. Subject
 * and check identifiers are local to a production, including when the subject
 * is a single model or motion case. The author places the expected behavior and
 * any valid exception in a comment beside each check.
 */
export interface IAutoMovieVerification {
  /** Stable subject address chosen by the production. */
  readonly id: string;

  /** Checks owned by the subject. Their IDs are unique within it. */
  readonly checks: readonly IAutoMovieVerification.Check[];

  /**
   * The checks the production adopted for each named stage. A required ID stays
   * required when its definition is disabled or removed.
   */
  readonly required?: Readonly<Record<string, readonly string[]>>;
}

/** Check inputs and the results derived from current observations. */
export namespace IAutoMovieVerification {
  /** Metadata shared by the supported kinds of observation. */
  interface IBase {
    /** Stable check ID within this subject. */
    readonly id: string;

    /** The expectation shown to the director. */
    readonly title: string;

    /** The inspection scope described to the director. */
    readonly scope: string;

    /** False keeps this definition visible while withholding execution. */
    readonly enabled?: boolean;
  }

  /** A deterministic measurement from the explicitly named input files. */
  export interface IMeasurement extends IBase {
    /** Evaluate through the supplied project code on an explicit run. */
    readonly kind: "measure";

    /**
     * Project-relative files the computation depends on, including its
     * implementation or data imports and the actual model or motion inputs. Use
     * the smallest complete set for this check. A nested production can name
     * paths to shared files within its Git checkout.
     */
    readonly source?: string;

    readonly inputs: readonly string[];

    /** Unit shared by the measurement and its inclusive bounds. */
    readonly unit: string;

    /** Inclusive lower limit, when specified. */
    readonly minimum?: number;

    /** Inclusive upper limit, when specified. */
    readonly maximum?: number;

    /**
     * Read the named inputs and return the observed finite quantity. The
     * callback may read the project directory and must leave its inputs
     * intact.
     */
    readonly measure: (root: string) => number | Promise<number>;
  }

  /** One check on a capture source's settled, drawn observations. */
  export interface ICapture extends IBase {
    /** Read an existing capture or refresh it through the capture command. */
    readonly kind: "capture";

    /** The capture's project-relative record.json, including its round path. */
    readonly record: string;

    /** Capture subject whose declared timeline and evaluated rows apply. */
    readonly subject: string;

    /**
     * Optional capture argv tokens after the subcommand. An explicit run uses
     * them to refresh this record in the normal host.
     */
    readonly capture?: readonly string[];

    /**
     * Project-relative scope inputs whose bytes an explicit refresh seals.
     * Include the module and relevant configuration, assets and dependencies.
     * In a nested production, include shared inputs within the Git checkout and
     * refresh the capture to establish its input identity.
     */
    readonly inputs?: readonly string[];

    /** The capture view requested by the check. */
    readonly view: string;

    /** The capture pass requested by the check. */
    readonly pass: string;

    /** Inspection continuity occurrence the checker reported on. */
    readonly occurrence: string;

    /** Existing diagnostic name and its checker-owned subject identity. */
    readonly diagnostic: { readonly check: string; readonly key: string };

    /**
     * One sample in subject seconds, or consecutive output frame indices with
     * the end exclusive. A still cannot satisfy a multi-frame range.
     */
    readonly at:
      | { readonly second: number }
      | { readonly fromFrame: number; readonly endFrame: number };
  }

  /** The published movie and, when required, its control record. */
  export interface IDelivery extends IBase {
    /** Validate the actual movie hash against its latest render report. */
    readonly kind: "delivery";

    /** Render subject recorded in the attempt. */
    readonly subject: string;

    /** Project-relative path of the latest render report. */
    readonly report: string;

    /** Required pass names in the control record beside that report. */
    readonly controls?: readonly string[];
  }

  /** A named person's observation of a specific delivered artifact and range. */
  export interface IReview extends IBase {
    /** Read the existing review observation. */
    readonly kind: "review";

    /** Project-relative path of the review observation. */
    readonly observation: string;

    /** Project-relative path of the exact movie the observation must describe. */
    readonly file: string;

    /** The render subject whose frame clock applies. */
    readonly subject: string;

    /** The activity the reviewer actually reported. */
    readonly viewed: "still" | "playback" | "listening";

    /** Zero-based output frame interval with exclusive end. */
    readonly frames: readonly [from: number, end: number];

    /** A specific source occurrence, when the criterion is tied to one shot. */
    readonly occurrence?: { readonly entry: number; readonly shot: string };
  }

  /** Facts used to evaluate one authored criterion. */
  export type Check = IMeasurement | ICapture | IDelivery | IReview;

  /** Outcome derived from the current evidence and selection. */
  export interface IResult {
    /** Subject as named in the production definition. */
    readonly target: string;

    /** Check ID within the subject. */
    readonly id: string;

    /** The current director-facing expectation. */
    readonly title: string;

    /** The stated part, view or time scope. */
    readonly scope: string;

    /** The current outcome and why it applies. */
    readonly state:
      | "passed"
      | "failed"
      | "not-run"
      | "unobserved"
      | "stale"
      | "disabled"
      | "awaiting-review";

    /** Observed value or the next action that can establish the result. */
    readonly message: string;

    /** The owning record, clip or receipt, when available. */
    readonly evidence?: string;

    /** Whether the requested stage requires this check. */
    readonly required: boolean;
  }

  /** A scope-specific readout and verdict for a deliberately requested stage. */
  export interface IReport {
    /** The selected subject IDs, in request order. */
    readonly targets: readonly string[];

    /** The requested stage, or null for status alone. */
    readonly requiredStage: string | null;

    /** Every selected check plus any required row omitted from the edit list. */
    readonly items: readonly IResult[];

    /** True only when the requested stage is blocked. */
    readonly blocked: boolean;
  }
}
