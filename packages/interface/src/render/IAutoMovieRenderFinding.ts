import { AutoMovieRenderMetric } from "./AutoMovieRenderMetric";
import { AutoMovieRenderFindingStatus } from "./AutoMovieRenderFindingStatus";
import { IAutoMovieRenderContributor } from "./IAutoMovieRenderContributor";

/**
 * One metric's measurement, limit, dominant owners, and way back.
 *
 * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `IAutoMovieRenderFinding` as the portable data boundary for the rendering compile render distinction requirement.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `IAutoMovieRenderFinding` for the spec render artifact lifecycle system contract.
 */
export interface IAutoMovieRenderFinding {
  /**
   * Metric this finding answers for.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `metric` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `metric` for the spec render artifact lifecycle system contract.
   */
  metric: AutoMovieRenderMetric;

  /**
   * Outcome.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `status` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `status` for the spec render artifact lifecycle system contract.
   */
  status: AutoMovieRenderFindingStatus;

  /**
   * Measured value, or `null` when the analysis produced none.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `measured` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `measured` for the spec render artifact lifecycle system contract.
   */
  measured: number | null;

  /**
   * Inclusive declared limit, or `null` when the metric is unbudgeted.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `limit` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `limit` for the spec render artifact lifecycle system contract.
   */
  limit: number | null;

  /**
   * How far above the limit the measurement is; zero unless `over`.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `excess` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `excess` for the spec render artifact lifecycle system contract.
   */
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
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `contributors` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence requirements/rendering/budgets.md#rendering-budget-decision Exposes only editable cost owners as the dominant contributors of a budget decision.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `contributors` for the spec render artifact lifecycle system contract.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Types the bounded editable-owner ranking separately from repeated frame-pass work.
   */
  contributors: IAutoMovieRenderContributor[];

  /**
   * Owners the report does not name: those past the bound, and the frame
   * passes that are never ranked.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `omittedContributors` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence requirements/rendering/budgets.md#rendering-budget-decision Counts every attributed owner left outside the bounded dominant-owner list.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `omittedContributors` for the spec render artifact lifecycle system contract.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Keeps frame passes and bounded-out owners visible as omitted contributors.
   */
  omittedContributors: number;

  /**
   * Total cost carried by the owners the report does not name.
   *
   * The listed contributors plus this number are the whole of what the
   * inventory attributed to the metric, frame passes included, so a report
   * never leaves a shortfall nothing on it explains.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `omittedCost` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence requirements/rendering/budgets.md#rendering-budget-decision Preserves the full measured cost beside the bounded dominant-owner list.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `omittedCost` for the spec render artifact lifecycle system contract.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Keeps excluded pass cost inside the accounted preflight total.
   */
  omittedCost: number;

  /**
   * Exactly what to change, or `null` when nothing is wrong.
   *
   * Present for `over`, `unsupported` and `not-run`; absent for `within` and
   * `unbudgeted`.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `recovery` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `recovery` for the spec render artifact lifecycle system contract.
   */
  recovery: string | null;
}
