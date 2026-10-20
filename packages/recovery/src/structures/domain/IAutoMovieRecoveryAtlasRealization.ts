import type { IAutoMovieRecoveryAtlasCounts } from "./IAutoMovieRecoveryAtlasCounts";

/**
 * Atlas domain completion and numerical approximation diagnostics.
 *
 * @evidence contracts/common.md#principled-implementation Named fields preserve the existing producer's quantities, units and discriminants without conversion.
 * @evidence contracts/common.md#clear-and-simple-design One structural contract names the record shared by its actual producer and consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This declaration computes no geometry and supplies no inferred data or fallback.
 * @evidence contracts/common.md#meaningful-documentation Members state units, ownership and qualification or absence semantics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An erased interface performs no arithmetic.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This type owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Records remain caller-owned and acquire no external resources.
 */
export interface IAutoMovieRecoveryAtlasRealization {
  /** Whether the requested patch domain was retained. */
  complete: boolean;

  /** Whether retained output met the requested approximation bound. */
  approximationQualified: boolean;

  /** Engine causes independent of finite output retention. */
  diagnostics: string[];

  /** Actual numerical populations and maximum error bound. */
  counts: IAutoMovieRecoveryAtlasCounts;
}
