import { AutoMovieRenderMetric } from "./AutoMovieRenderMetric";

/**
 * One owner's share of one metric.
 *
 * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `IAutoMovieRenderOwnerCost` as the portable data boundary for the rendering compile render distinction requirement.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `IAutoMovieRenderOwnerCost` for the spec render artifact lifecycle system contract.
 */
export interface IAutoMovieRenderOwnerCost {
  /**
   * Stable owner id.
   *
   * For a cost that paints pixels this is a semantic-mask id, so the report and
   * the mask name the same thing. Shared resources that draw nothing of their
   * own carry a `model:`, `material:`, `texture:` or `light:` identity instead:
   * attributing one shared texture to every node that binds it would count its
   * bytes once per node and describe a memory cost nobody pays.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `owner` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `owner` for the spec render artifact lifecycle system contract.
   */
  owner: string;

  /**
   * Source location that owns or induces this cost.
   *
   * An `own` row points to the production record an author edits. A `pass` row
   * is attribution rather than an edit instruction: a shadow pass points to the
   * light that induced it, while a renderer-owned guide pass may have no
   * production record at all.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `source` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence requirements/rendering/budgets.md#rendering-budget-decision Identifies the production owner to edit or the frame-pass source whose separately stated work the budget decision attributes.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `source` for the spec render artifact lifecycle system contract.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Types the distinction between editable owner location and pass attribution in budget preflight evidence.
   */
  source: string;

  /**
   * Metric this row contributes to.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `metric` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `metric` for the spec render artifact lifecycle system contract.
   */
  metric: AutoMovieRenderMetric;

  /**
   * Whether the row is the owner's own cost or one further whole-frame pass.
   *
   * `own` is what the owner itself puts in the frame. `pass` is a complete
   * further submission of geometry the `own` rows already paid for, such as a
   * shadow map's depth pass or the outline guide pass. It is charged to the
   * light or pass that induced it because a conservative one-frame peak has to
   * include that work and a reader has to distinguish the room's cost from the
   * cost of drawing it again.
   *
   * The two are marked rather than mixed because they answer different
   * questions. A `pass` row's cost is the sum of every drawable that preceded
   * it, so it can never lose the top of a cost-descending ranking; ranking it
   * as an owner's own complexity answers "what do I edit" with a constant and,
   * for a renderer-owned guide pass, with a name a production has no field to
   * declare. Only `own` rows participate in that ranking. A pass attribution
   * remains available for a separate explanation, including the shadow light
   * an author could disable deliberately.
   *
   * An inventory written before this distinction has no `kind`; report
   * evaluation reads that legacy spelling as `own` so the additive field does
   * not invalidate an otherwise valid version-one inventory.
   *
   * @evidence requirements/rendering/budgets.md#rendering-budget-decision Exposes whether an attributed cost is an editable owner or repeated frame-pass work so the budget decision can rank the former without dropping the latter.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Types the owner/pass distinction required by budget preflight ranking and accounting.
   */
  kind?: "own" | "pass";

  /**
   * Exact contribution in the metric's unit.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `cost` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `cost` for the spec render artifact lifecycle system contract.
   */
  cost: number;
}
