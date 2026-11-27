import type { IAutoMovieRecoveryAtlasCounts } from "..";

/** Atlas domain completion and numerical approximation diagnostics. */

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
