import { AutoMovieAnalysisDomain } from "./AutoMovieAnalysisDomain";

/**
 * One domain's tally inside an analysis report.
 *
 * Every submitted run is counted once in {@link runs} and then exactly once
 * more, as {@link stale} when it read another revision or else as
 * {@link solved}, {@link unsupported} or {@link notRun}, so `runs` equals the
 * sum of those four. Measured metrics that are neither `meets` nor `misses` are
 * untargeted and are not given a field of their own.
 *
 * @evidence contracts/common.md#principled-implementation Plain counters filled in one pass of `summarizeAutoMovieAnalysis`: a stale run is counted only as stale, a current run once by its outcome arm, and each metric of a current solved run as measured or as a gap.
 * @evidence contracts/common.md#clear-and-simple-design Counts rather than run lists keep the row bounded however many runs a domain has, and untargeted metrics stay implicit as measured minus meets minus misses instead of adding a fifth metric counter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No domain or run id changes how it is tallied; `required` comes from the caller's required list, and a required domain with no runs gets a separate report gap rather than a fabricated run row.
 * @evidence contracts/common.md#meaningful-documentation States what each counter includes, that stale runs are excluded from the outcome counters, the identity relating them to `runs`, and how untargeted metrics are derived.
 */
export interface IAutoMovieAnalysisDomainRollup {
  /** Domain this row answers for. */
  domain: AutoMovieAnalysisDomain;

  /** Runs submitted for the domain, stale ones included. */
  runs: number;

  /** Runs that solved against the current revision. */
  solved: number;

  /** Runs against the current revision that the host cannot perform. */
  unsupported: number;

  /**
   * Runs against the current revision that an adapter could have performed but
   * did not.
   */
  notRun: number;

  /**
   * Runs of any outcome that read a superseded design revision; they are
   * counted nowhere else in this row.
   */
  stale: number;

  /** Metrics declared across the domain's current solved runs. */
  metrics: number;

  /** Of those, the ones that produced a value. */
  measured: number;

  /** Of the measured ones, those satisfying a declared target. */
  meets: number;

  /** Of the measured ones, those violating a declared target. */
  misses: number;

  /** Whether the production required this domain to be answered. */
  required: boolean;
}
