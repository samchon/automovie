import { AutoMovieAnalysisDomain } from "./AutoMovieAnalysisDomain";

/**
 * One domain's tally inside an analysis report.
 *
 * Every submitted run is counted once in {@link runs} and then exactly once
 * more, as {@link stale} when it read another revision or else as
 * {@link solved}, {@link unsupported} or {@link notRun}, so `runs` equals the
 * sum of those four. Metric counts come only from current solved runs, and
 * measured metrics that are neither `meets` nor `misses` are untargeted and
 * have no field of their own.
 *
 * @evidence contracts/common.md#principled-implementation Counters filled in one pass by `summarizeAutoMovieAnalysis`: each run increments `runs` and then exactly one outcome counter, and only current solved runs add to the metric counters, which keeps the `runs` sum identity exact.
 * @evidence contracts/common.md#clear-and-simple-design Plain counts per domain with no embedded run list, so a report stays one fixed-size row per domain however many runs were submitted; run-level detail lives in the report's gap list.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A stale run's outcome is never counted as solved or its metrics as measured, and a required domain with zero runs keeps `runs: 0` beside `required: true` instead of being omitted.
 * @evidence contracts/common.md#meaningful-documentation States the counting identity, which runs feed the metric counters, why untargeted metrics have no field, and what each counter includes.
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
