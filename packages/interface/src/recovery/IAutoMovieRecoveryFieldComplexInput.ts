import type {
  IAutoMovieRecoveryEventChartInput,
  IAutoMovieRecoveryUnsupportedDomain,
} from "..";

/** Named source-free charts and the producer's observation coverage. */

export interface IAutoMovieRecoveryFieldComplexInput {
  /** Nonempty topology domain for the assembled atlas. */
  id: string;

  /** Caller-owned chart declarations in admission order. */
  charts: readonly IAutoMovieRecoveryEventChartInput[];

  /** Previously omitted observations and their original causes. */
  unsupported?: readonly IAutoMovieRecoveryUnsupportedDomain[];

  /** Producer observation completion independent of coefficient assembly. */
  observationComplete: boolean;
}
