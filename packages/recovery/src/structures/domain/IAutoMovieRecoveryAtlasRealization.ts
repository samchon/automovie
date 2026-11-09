import type { IAutoMovieRecoveryAtlasCounts } from "./IAutoMovieRecoveryAtlasCounts";

/**
 * Atlas domain completion and numerical approximation diagnostics.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields preserve the existing producer's quantities, units and discriminants without conversion.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One structural contract names the record shared by its actual producer and consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This declaration computes no geometry and supplies no inferred data or fallback.
 * @evidence contracts/development/common.md#meaningful-documentation Members state units, ownership and qualification or absence semantics.
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
