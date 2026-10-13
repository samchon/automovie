import { AutoMovieRenderFindingStatus } from "./AutoMovieRenderFindingStatus";
import { AutoMovieRenderMetric } from "./AutoMovieRenderMetric";
import { IAutoMovieRenderContributor } from "./IAutoMovieRenderContributor";

/** One metric's measurement, limit, dominant owners, and way back. */
export interface IAutoMovieRenderFinding {
  /** Metric this finding answers for. */
  metric: AutoMovieRenderMetric;

  /** Outcome. */
  status: AutoMovieRenderFindingStatus;

  /** Measured value, or `null` when the analysis produced none. */
  measured: number | null;

  /** Inclusive declared limit, or `null` when the metric is unbudgeted. */
  limit: number | null;

  /** How far above the limit the measurement is; zero unless `over`. */
  excess: number;

  /**
   * Dominant owners, descending by cost then ascending by owner id.
   *
   * Bounded by {@link AUTOMOVIE_RENDER_REPORT_MAX_CONTRIBUTORS}. Ties break on
   * the id so the list is deterministic rather than dependent on the order the
   * inventory happened to visit owners.
   *
   * These are the places an author can edit, so only the inventory's `own`
   * rows are ranked here. A frame pass redraws what the listed owners already
   * paid for, which makes its cost their sum and its position in a
   * cost-descending list a constant; it is counted in
   * {@link omittedContributors} and {@link omittedCost} instead, and named in
   * {@link recovery} as a pass rather than as somewhere to go and change.
   */
  contributors: IAutoMovieRenderContributor[];

  /**
   * Owners the report does not name: those past the bound, and the frame
   * passes that are never ranked.
   */
  omittedContributors: number;

  /**
   * Total cost carried by the owners the report does not name.
   *
   * The listed contributors plus this number are the whole of what the
   * inventory attributed to the metric, frame passes included, so a report
   * never leaves a shortfall nothing on it explains.
   */
  omittedCost: number;

  /**
   * Exactly what to change, or `null` when nothing is wrong.
   *
   * Present for `over`, `unsupported` and `not-run`; absent for `within` and
   * `unbudgeted`.
   */
  recovery: string | null;
}
