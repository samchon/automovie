import type { IAutoMovieRecoveryAtlasCounts } from "../../index";

/**
 * Atlas domain completion and numerical approximation diagnostics.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Whether the requested patch domain was retained. Whether retained output met the requested approximation bound.
 * @evidence contracts/development/design.md#principled-representation Engine causes independent of finite output retention.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieRecoveryAtlasCompilation, IAutoMovieRecoveryAtlasGeneration share IAutoMovieRecoveryAtlasRealization's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Engine causes independent of finite output retention.
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
