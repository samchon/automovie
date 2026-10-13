import { AutoMovieAnalysisDomain } from "./AutoMovieAnalysisDomain";

/** One domain's tally, in the fixed domain order. */
export interface IAutoMovieAnalysisDomainRollup {
  /** Domain this row answers for. */
  domain: AutoMovieAnalysisDomain;

  /** Runs submitted for the domain. */
  runs: number;

  /** Runs that solved against the current revision. */
  solved: number;

  /** Runs the host cannot perform. */
  unsupported: number;

  /** Runs an adapter could have performed but did not. */
  notRun: number;

  /** Solved runs that read a superseded design revision. */
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
