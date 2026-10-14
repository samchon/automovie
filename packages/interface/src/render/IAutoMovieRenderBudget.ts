import { AutoMovieRenderMetric } from "./AutoMovieRenderMetric";

/**
 * The hard render cost a production declares it will stay inside, per quality tier.
 *
 * A budget is a design decision, not a measurement: it is authored beside the production it constrains rather than read back off it. That direction matters. Numbers derived from whatever the current scene happens to cost would ratify every regression the moment it lands, so no limit here is ever inferred from an inventory; a production that declares no budget is reported as unbudgeted rather than silently given one.
 *
 * Engine evaluation and Render's explicit-argument preflight helpers compare supplied budgets with inventory. The current repository has no execution reader for ProductionDesign.renderBudgets, and those Render helpers currently have only test or internal-helper callers. Declaring this field therefore connects no automatic render-job refusal, and successful design compilation proves no budget clearance.
 *
 * Limits are inclusive: a measurement exactly equal to its limit is inside the budget. An omitted metric is unbudgeted, which the report states explicitly so an author can tell "allowed to be large" from "nobody thought about it".
 *
 * A budget declares limits, not passes. The renderer decides which passes a frame runs: one depth pass per shadow view (six faces for a point light), the supported filter's post passes, or the alternative outline guide peak. One casting light's shadow resource is distinct from these submissions. The conservative one-frame peak has to include them whether or not a production has an opinion about them. There is deliberately no field here to switch one off, because switching a pass off is not budgeting, it is choosing a different frame. What the production is owed instead is the arithmetic: the report states what the passes added apart from what the drawable owners cost, and it never offers a pass as somewhere to edit. A declared pass set would reopen this only alongside a renderer that can actually be asked for a different one.
 *
 * @evidence contracts/common.md#principled-implementation Production-authored non-negative safe-integer limits are compared inclusively with preflight exact counts or conservative upper bounds at the selected render tier, independently of the inventory being measured.
 * @evidence contracts/common.md#clear-and-simple-design A versioned tier and partial metric map express agreed cost limits without letting budgeting choose or disable renderer-owned passes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omitted metrics remain unbudgeted and no limit is derived from current scene cost; invalid fractional or non-finite limits throw instead of ratifying a regression.
 * @evidence contracts/common.md#meaningful-documentation Defines production ownership, tier selection, inclusive limits, omitted metrics, render-time preflight and whole-frame pass accounting.
 * @author Samchon
 */
export interface IAutoMovieRenderBudget {
  /** Budget format. */
  version: 1;

  /**
   * Non-blank quality tier this budget describes, such as `review` or `delivery`. One production may declare several tiers and check an artifact against the one a render job targets.
   */
  tier: string;

  /**
   * Inclusive maximum per metric. An omitted metric is unbudgeted.
   *
   * Every value is a non-negative safe integer. The engine range-checks them, because a negative or fractional triangle limit is an authoring mistake that would otherwise read as a permanently failing budget.
   */
  limits: Partial<Record<AutoMovieRenderMetric, number>>;
}
