import type { IAutoMovieRecoveryEventChartInput } from "./IAutoMovieRecoveryEventChartInput";
import type { IAutoMovieRecoveryUnsupportedDomain } from "./IAutoMovieRecoveryUnsupportedDomain";

/**
 * Named source-free charts and the producer's observation coverage.
 *
 * @evidence contracts/common.md#principled-implementation Named fields preserve the existing producer's quantities, units and discriminants without conversion.
 * @evidence contracts/common.md#clear-and-simple-design One structural contract names the record shared by its actual producer and consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This declaration computes no geometry and supplies no inferred data or fallback.
 * @evidence contracts/common.md#meaningful-documentation Members state units, ownership and qualification or absence semantics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An erased interface performs no arithmetic.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This type owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Records remain caller-owned and acquire no external resources.
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
