import { AutoMovieRenderFindingStatus } from "./AutoMovieRenderFindingStatus";
import { AutoMovieRenderMetric } from "./AutoMovieRenderMetric";
import { IAutoMovieRenderContributor } from "./IAutoMovieRenderContributor";

/**
 * One render metric's preflight measurement, declared limit, bounded editable owners and corrective action.
 *
 * @evidence contracts/common.md#principled-implementation Evaluation classifies measured versus missing analysis and inclusive budget comparison, then ranks only own-cost rows while preserving omitted contributor count and all remaining attributed cost.
 * @evidence contracts/common.md#clear-and-simple-design One finding keeps outcome, numeric basis and bounded attribution together, with nullable recovery only when a cost breach or analysis gap needs correction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unbudgeted and unmeasured remain distinct null states, and pass/runtime costs are accounted without ranking them as author-editable geometry; omitted cost prevents silent truncation.
 * @evidence contracts/common.md#meaningful-documentation Defines measured and limit nulls, excess, deterministic contributor ordering and bound, omitted accounting and recovery presence.
 * @author Samchon
 */
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
   * Bounded by the evaluator's caller-selected positive safe integer K, which defaults to the engine's contributor limit. Ties break on the id so the list is deterministic rather than dependent on inventory traversal order.
   *
   * These are the places an author can edit, so only the inventory's `own` rows are ranked here. A frame pass redraws what the listed owners already paid for, which makes its cost their sum and its position in a cost-descending list a constant; it is counted in {@link omittedContributors} and {@link omittedCost} instead, and named in {@link recovery} as a pass rather than as somewhere to go and change.
   */
  contributors: IAutoMovieRenderContributor[];

  /**
   * Distinct own owners beyond the bound plus pass and runtime owners, which are never ranked as editable contributors.
   */
  omittedContributors: number;

  /**
   * Total cost carried by the owners the report does not name.
   *
   * Listed contributors plus this number partition the supplied owner rows for this metric, including pass and runtime rows. The evaluator does not prove their sum equals the separately supplied measured total; inventory consistency is a caller premise.
   */
  omittedCost: number;

  /**
   * Exactly what to change, or `null` when nothing is wrong.
   *
   * Present for `over`, `unsupported` and `not-run`; absent for `within` and `unbudgeted`.
   */
  recovery: string | null;
}
