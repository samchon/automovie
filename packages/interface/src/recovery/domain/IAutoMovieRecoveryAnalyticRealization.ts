import type { IAutoMovieModel, IAutoMovieRecoveryAnalyticReport, IAutoMovieRecoveryConstructionLine } from "../../index";

/**
 * Finite analytic output and the exact saved occurrences delegated to it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Retained generated model parts. Actual coefficient-net lines in model metres.
 * @evidence contracts/development/design.md#principled-representation Finite analytic output and the exact saved occurrences delegated to it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface reconstructRecovery, realizeAutoMovieRecoveryAnalyticDomains share IAutoMovieRecoveryAnalyticRealization's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Actual coefficient-net lines in model metres.
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
