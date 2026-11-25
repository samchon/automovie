import type { IAutoMovieModel } from "../../model/IAutoMovieModel";
import type { IAutoMovieConstructionPolyline } from "../../render/IAutoMovieConstructionPolyline";
import type { IAutoMovieRecoveryAnalyticReport } from "./IAutoMovieRecoveryAnalyticReport";

/** Finite analytic output and the exact saved occurrences delegated to it. */

export interface IAutoMovieRecoveryAnalyticRealization {
  /** Retained generated model parts. */
  parts: IAutoMovieModel["parts"];

  /** Actual coefficient-net lines in model metres. */
  construction: IAutoMovieConstructionPolyline.IMutable[];

  /** Closed interval:group keys mapped to generating domain identities. */
  closedGroups: Map<string, string>;

  /** Open interval:pair keys mapped to generating domain identities. */
  openPairs: Map<string, string>;

  /** Unresolved interval:group keys mapped to generating domain identities. */
  openUnresolved: Map<string, string>;

  /**
   * Independent admission, coverage and numerical results for each supplied
   * domain.
   */
  reports: IAutoMovieRecoveryAnalyticReport[];
}
