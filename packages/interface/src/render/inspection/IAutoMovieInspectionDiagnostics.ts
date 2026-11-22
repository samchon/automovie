import type { IAutoMovieVector3 } from "../../geometry/IAutoMovieVector3";
import type { IAutoMovieDiagnostic } from "../../production/IAutoMovieDiagnostic";

/**
 * Findings and coverage from one evaluated inspection sample.
 *
 * @evidence contracts/development/design.md#principled-representation A continuity scope and the source clock locate one sample. Findings describe observed evidence while separate coverage records describe what each check attempted.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This packet carries only the clock, scope, findings and coverage consumed by the episode reducer and inspection hosts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An output frame comes from the delivery clock and is optional at an arbitrary seek. Coarse evidence and unavailable coverage cannot claim a confirmed fault.
 * @evidence contracts/development/common.md#meaningful-documentation Documents the scope, timebase, finding identity, evidence ranking, and coverage states.
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
   *
   * @evidence contracts/development/design.md#principled-representation Separates the film seconds from the optional zero-based output index and the producer's shot-local seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The reducer reads film seconds and output index. Review consumers retain the shot address when its owner supplies it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Off-grid samples leave the output index absent. A generic subject can leave both optional fields absent.
   * @evidence contracts/development/common.md#meaningful-documentation Names the coordinate origin and units of all stored clocks.
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
   *
   * @evidence contracts/development/design.md#principled-representation A path addresses the shot occurrence and seconds describe the owner's local clock.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Retains the address and local time a reviewer can use to locate the evidence.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The owner supplies these facts when known. The report cannot infer them from the output clock.
   * @evidence contracts/development/common.md#meaningful-documentation Names the origin of the path and the seconds.
   */
  export interface IShotTime {
    /** Canonical path of the authored shot occurrence. */
    readonly path: string;

    /** Finite seconds on the owner's shot-local clock. */
    readonly seconds: number;
  }

  /**
   * The evidence emitted for one occurrence of a named rule.
   *
   * @evidence contracts/development/design.md#principled-representation Portable codes, owned keys and paths identify findings. Category and confidence jointly determine whether observed evidence blocks delivery.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Places the identifying data beside the message and witness that the Viewer and report need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The reducer groups by identifiers and compares declared witness rank without parsing the message.
   * @evidence contracts/development/common.md#meaningful-documentation Describes the coverage identity, code, paths, confidence, category and witness.
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
   *
   * @evidence contracts/development/design.md#principled-representation World points, exact times, finite ranks and named measurements keep spatial and temporal evidence independent from the text message.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Each optional member is consumed by the report, the reducer's witness comparison or the inspection presentation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Bounds and sampled witness time are separate. An interval bracket alone does not invent an exact collision time or output frame.
   * @evidence contracts/development/common.md#meaningful-documentation Documents the optional time, world coordinate system, interval and ranking semantics.
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
   *
   * @evidence contracts/development/design.md#principled-representation Two finite seconds locate the reported interval while the witness can separately name a measured instant.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Retains only the endpoints supplied by the check.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The interval carries no assumed interpolation law or presentation-frame rounding.
   * @evidence contracts/development/common.md#meaningful-documentation Defines the bounds in film seconds.
   */
  export interface IInterval {
    /** Lower bound in film seconds. */
    readonly from: number;

    /** Upper bound in film seconds, at or after the lower bound. */
    readonly to: number;
  }

  /**
   * A measured quantity and its comparison limit when one applies.
   *
   * @evidence contracts/development/design.md#principled-representation A number holds a finite measurement while a decimal string can preserve a native timestamp beyond exact binary64 integer range.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Name and unit give the value meaning outside its producer. Only checks with a comparison limit need supply one.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reports retain native values and units. The episode reducer ranks the separate declared witness rank without interpreting arbitrary units.
   * @evidence contracts/development/common.md#meaningful-documentation States how values, limits and units are interpreted.
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
   *
   * @evidence contracts/development/design.md#principled-representation A checker and stable key address an obligation. The status distinguishes successful observation, explicit exclusion and unresolved coverage.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The same row supports release gating and explains incomplete or excluded scope.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Every unresolved or excluded row carries a reason. The required flag is chosen by the obligation owner.
   * @evidence contracts/development/common.md#meaningful-documentation Describes the four statuses and the scope of the required flag.
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
   *
   * @evidence contracts/development/design.md#principled-representation Joins the source finding to its exact witness time or the enclosing sample time when no override was given.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Used for the first and worst witnesses in the same episode.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the source clock without rounding.
   * @evidence contracts/development/common.md#meaningful-documentation Describes the exact time chosen for the observation.
   */
  export interface IObservation {
    /** Exact witness clock, or the clock of the enclosing sample. */
    readonly time: ITime;

    /** The original finding at this observation. */
    readonly finding: IFinding;
  }

  /**
   * Consecutive observations of one finding identity in a checked scope.
   *
   * @evidence contracts/development/design.md#principled-representation First and worst observations preserve distinct evidence. The last sample clock and count describe observed coverage rather than inferred event boundaries.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Supports review jumps, delivery diagnostics and inspection history with two full witnesses.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The reducer joins only adjacent output frames with checked coverage for that identity.
   * @evidence contracts/development/common.md#meaningful-documentation States the meaning of the scope, first and worst observation, last sample and sample count.
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
  }

  /**
   * One coverage row over consecutive output frames or a single off-grid sample.
   *
   * @evidence contracts/development/design.md#principled-representation A scoped status and two sample clocks describe the observed range, with a count that measures records actually seen.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Reports long unchanged coverage without repeating the same row for every frame.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Adjacency comes from output indices. The reducer splits ranges on skipped frames, scope changes and changed outcomes.
   * @evidence contracts/development/common.md#meaningful-documentation States that the endpoints are observations and what the count measures.
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

    /** An unchanged coverage outcome across the range. */
    readonly coverage: ICoverage;
  }

  /**
   * Summary of the supplied inspection samples.
   *
   * @evidence contracts/development/design.md#principled-representation Episodes and coverage ranges retain observed evidence. Separate verdict flags distinguish confirmed errors and unresolved delivery obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Carries evidence, the observed delivery count and the two facts needed by a host to gate publication.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Sparse capture requires no fabricated expected frame count, and incomplete required coverage cannot pass a declared delivery schedule.
   * @evidence contracts/development/common.md#meaningful-documentation Defines what the coverage, frame counts and decision flags claim.
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
