import type { IAutoMovieVector3 } from "../../geometry/IAutoMovieVector3";
import type { IAutoMovieDiagnostic } from "../../production/IAutoMovieDiagnostic";

/**
 * Findings and coverage from one evaluated inspection sample.
 */
export interface IAutoMovieInspectionDiagnostics {
  /** Source-owned continuity occurrence. Use a distinct scope after a cut or for each concurrently displayed shot layer. */
  readonly scope: string;

  /** Time of the evaluated scene sample. */
  readonly time: IAutoMovieInspectionDiagnostics.ITime;

  /** Findings at this sample. Each check, key, code and ordered path tuple occurs once. */
  readonly findings: readonly IAutoMovieInspectionDiagnostics.IFinding[];

  /** Outcomes of the expected checks for this scope and sample. Each check and key occurs once. */
  readonly coverage: readonly IAutoMovieInspectionDiagnostics.ICoverage[];
}

export namespace IAutoMovieInspectionDiagnostics {
  /**
   * A position on the film clock, optionally tied to its actual delivered frame and source shot clock.
   */
  export interface ITime {
    /** Finite seconds from the beginning of the evaluated film. */
    readonly filmSeconds: number;

    /** Actual zero-based frame index from the delivery schedule, when applicable. */
    readonly outputFrame?: number;

    /** The shot occurrence and its local time as supplied by the film owner. */
    readonly shot?: IShotTime;
  }

  /**
   * A source-addressed shot reading.
   */
  export interface IShotTime {
    /** Canonical path of the authored shot occurrence. */
    readonly path: string;

    /** Finite seconds on the owner's shot-local clock. */
    readonly seconds: number;
  }

  /**
   * The evidence emitted for one occurrence of a named rule.
   */
  export interface IFinding {
    /** Stable name of the checker which produced this finding. */
    readonly check: string;

    /** Stable checker-owned evidence identity, shared with the corresponding coverage row. */
    readonly key: string;

    /** Stable diagnostic code owned by that checker. */
    readonly code: string;

    /** Canonically ordered entity or part paths. Empty for evidence that concerns an entire source stream. */
    readonly paths: readonly string[];

    /** Category to use when the evidence is confirmed. */
    readonly category: IAutoMovieDiagnostic["category"];

    /** A coarse possible violation or an observed violation from admitted evidence. */
    readonly confidence: "candidate" | "confirmed";

    /** Human-readable description of the observed evidence. */
    readonly message: string;

    /** Time, geometry and measured values the checker can substantiate. */
    readonly witness: IWitness;
  }

  /**
   * The measurements and location of one finding.
   */
  export interface IWitness {
    /** Exact witness time when it differs from or lacks the output index of the enclosing sample. */
    readonly time?: ITime;

    /** Measured witness point in world metres, when available. */
    readonly point?: IAutoMovieVector3;

    /** Bounds in film seconds for an interval finding. These do not imply a collision at either endpoint. */
    readonly interval?: IInterval;

    /** Finite checker-owned magnitude used only among findings of the same identity. Larger values express worse evidence. */
    readonly rank?: number;

    /** Measurements or source timestamps this checker reported, with their units. */
    readonly measurements?: readonly IMeasurement[];
  }

  /**
   * A bounded witness interval on the film clock.
   */
  export interface IInterval {
    /** Lower bound in film seconds. */
    readonly from: number;

    /** Upper bound in film seconds, at or after the lower bound. */
    readonly to: number;
  }

  /**
   * A measured quantity and its comparison limit when one applies.
   */
  export interface IMeasurement {
    /** Stable name of the measured quantity. */
    readonly name: string;

    /** Finite number or exact decimal value supplied by the measurement owner. */
    readonly value: number | string;

    /** Comparison limit in the same unit, when the rule has one. */
    readonly limit?: number | string;

    /** Measurement unit or the source stream's exact timebase for a native timestamp. */
    readonly unit: string;
  }

  /**
   * One checked, intentionally excluded, deferred or unsupported obligation.
   */
  export type ICoverage = {
    /** Stable name of the checker that owns the obligation. */
    readonly check: string;

    /** Checker-owned identity of the inspected item or pair. */
    readonly key: string;

    /** Whether delivery requires resolution of this obligation. */
    readonly required: boolean;
  } & (
    | { readonly status: "checked" }
    | {
        readonly status: "deferred" | "unsupported" | "excluded";
        readonly reason: string;
      }
  );

  /**
   * Observed finding with its resolved evidence clock.
   */
  export interface IObservation {
    /** Exact witness clock, or the clock of the enclosing sample. */
    readonly time: ITime;

    /** The original finding at this observation. */
    readonly finding: IFinding;
  }

  /**
   * Consecutive observations of one finding identity in a checked scope.
   */
  export interface IEpisode {
    /** Continuity occurrence that owns these observations. */
    readonly scope: string;

    /** The first observation in sample order. */
    readonly first: IObservation;

    /** Strongest confidence, then category, then rank. The earlier observation wins a tie. */
    readonly worst: IObservation;

    /** Clock of the last inspected sample in this episode. */
    readonly last: ITime;

    /** Number of distinct samples in this episode. */
    readonly samples: number;

    readonly sampledShotClock?: boolean;
  }

  /**
   * One coverage row over consecutive output frames or a single off-grid sample.
   */
  export interface ICoverageRange {
    /** Continuity occurrence that owns this obligation. */
    readonly scope: string;

    /** Clock of its first observed sample. */
    readonly first: ITime;

    /** Clock of its last observed sample. */
    readonly last: ITime;

    /** Number of distinct samples with this outcome. */
    readonly samples: number;

    readonly sampledShotClock?: true;

    /** An unchanged coverage outcome across the range. */
    readonly coverage: ICoverage;
  }

  /**
   * Summary of the supplied inspection samples.
   */
  export interface IAudit {
    /** Episodes in first observation order. */
    readonly episodes: readonly IEpisode[];

    /** Coverage ranges in first observation order. */
    readonly coverage: readonly ICoverageRange[];

    /** Number of distinct output indices seen across the supplied scopes. */
    readonly observedOutputFrames: number;

    /** Count supplied by the delivery schedule. Sparse captures can leave it absent. */
    readonly expectedOutputFrames?: number;

    /** At least one error has confirmed evidence. */
    readonly hasBlockingFinding: boolean;

    /** A required check is deferred or unsupported, or a frame of the declared schedule is unobserved. */
    readonly unresolvedRequiredCoverage: boolean;
  }
}
