import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieRecoveryConstructionLine } from "../curve/IAutoMovieRecoveryConstructionLine";
import type { IAutoMovieRecoveryAnalyticReport } from "./IAutoMovieRecoveryAnalyticReport";

/**
 * Finite analytic output and the exact saved occurrences delegated to it.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields retain the existing producer's quantities, units and independent qualifications.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This shared structural contract names the actual operation result without deriving it from a function signature.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This declaration supplies no inferred observation, geometry or fallback.
 * @evidence contracts/development/common.md#meaningful-documentation Members document quantity, ownership, optional-state and qualification meaning.
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
