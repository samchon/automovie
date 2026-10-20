import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieRecoveryConstructionLine } from "../curve/IAutoMovieRecoveryConstructionLine";
import type { IAutoMovieRecoveryAnalyticReport } from "./IAutoMovieRecoveryAnalyticReport";

/**
 * Finite analytic output and the exact saved occurrences delegated to it.
 *
 * @evidence contracts/common.md#principled-implementation Named fields retain the existing producer's quantities, units and independent qualifications.
 * @evidence contracts/common.md#clear-and-simple-design This shared structural contract names the actual operation result without deriving it from a function signature.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This declaration supplies no inferred observation, geometry or fallback.
 * @evidence contracts/common.md#meaningful-documentation Members document quantity, ownership, optional-state and qualification meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An erased interface performs no arithmetic.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This type owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns returned records and arrays; the type acquires no resources.
 */
export interface IAutoMovieRecoveryAnalyticRealization {
  /** Retained generated model parts. */
  parts: IAutoMovieModel["parts"];

  /** Actual coefficient-net lines in model metres. */
  construction: IAutoMovieRecoveryConstructionLine[];

  /** Closed interval:group keys mapped to generating domain identities. */
  closedGroups: Map<string, string>;

  /** Open interval:pair keys mapped to generating domain identities. */
  openPairs: Map<string, string>;

  /** Unresolved interval:group keys mapped to generating domain identities. */
  openUnresolved: Map<string, string>;

  /** Independent admission, coverage and numerical results for each supplied domain. */
  reports: IAutoMovieRecoveryAnalyticReport[];
}
