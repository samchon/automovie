import type { IAutoMovieRecoveryEventChartInput } from "./IAutoMovieRecoveryEventChartInput";
import type { IAutoMovieRecoveryUnsupportedDomain } from "./IAutoMovieRecoveryUnsupportedDomain";

/**
 * Named source-free charts and the producer's observation coverage.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields preserve the existing producer's quantities, units and discriminants without conversion.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One structural contract names the record shared by its actual producer and consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This declaration computes no geometry and supplies no inferred data or fallback.
 * @evidence contracts/development/common.md#meaningful-documentation Members state units, ownership and qualification or absence semantics.
 */
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
