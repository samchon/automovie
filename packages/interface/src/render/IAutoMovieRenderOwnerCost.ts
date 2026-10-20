import { AutoMovieRenderMetric } from "./AutoMovieRenderMetric";

/**
 * One owner's share of one metric.
 *
 * @evidence contracts/common.md#principled-implementation Inventory assigns each metric contribution to semantic drawable or shared-resource identity, separating editable own complexity from repeated pass work and renderer-owned runtime storage.
 * @evidence contracts/common.md#clear-and-simple-design Optional kind preserves older own-row spelling while explicit pass/runtime rows retain full attribution without contaminating editable contributor ranking.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Shared bytes are counted by resource ownership rather than once per node, and runtime/pass costs stay in totals and omitted accounting instead of becoming false source-edit advice.
 * @evidence contracts/common.md#meaningful-documentation Defines owner/source authority, metric units, own/pass/runtime distinctions and legacy absent-kind interpretation.
 */
export interface IAutoMovieRenderOwnerCost {
  /**
   * Stable owner id.
   *
   * For a cost that paints pixels this is a semantic-mask id, so the report and the mask name the same thing. Shared resources that draw nothing of their own carry a `model:`, `material:`, `texture:` or `light:` identity instead: attributing one shared texture to every node that binds it would count its bytes once per node and describe a memory cost nobody pays.
   */
  owner: string;

  /**
   * Source location that owns or induces this cost.
   *
   * An `own` row points to the production record an author edits. A `pass` row is attribution rather than an edit instruction: a shadow pass points to the light that induced it, while a renderer-owned guide pass may have no production record at all.
   */
  source: string;

  /** Metric this row contributes to. */
  metric: AutoMovieRenderMetric;

  /**
   * Whether the row is editable source cost, a further whole-frame pass or shared renderer-owned storage. `runtime` has no author-editable owner; its cost remains in totals and omitted accounting, outside owner ranking.
   *
   * `own` is the drawable or resource's own contribution. `pass` attributes further frame work, such as repeated depth geometry and VSM filtering for a shadow caster or an outline submission. These contributions remain in totals and are charged to the inducing light/pass, separate from editable source complexity.
   *
   * Only own rows participate in editable contributor ranking; pass and runtime rows remain in omitted accounting. Pass recovery separately names the inducing work, including a shadow light an author can deliberately disable, rather than treating aggregate redraw/filter cost as one drawable's complexity.
   *
   * An inventory written before this distinction has no `kind`; report evaluation reads that legacy spelling as `own` so the additive field does not invalidate an otherwise valid version-one inventory.
   */
  kind?: "own" | "pass" | "runtime";

  /** Exact contribution in the metric's unit. */
  cost: number;
}
