import { AutoMovieAnalysisDomain } from "./AutoMovieAnalysisDomain";

/**
 * One domain's tally inside an analysis report.
 *
 * Every submitted run is counted once in {@link runs} and then exactly once
 * more, as {@link stale} when it read another revision or else as
 * {@link solved}, {@link unsupported} or {@link notRun}, so `runs` equals the
 * sum of those four. Measured metrics that are neither `meets` nor `misses` are
 * untargeted and are not given a field of their own.
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
