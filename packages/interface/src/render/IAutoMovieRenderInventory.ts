import { IAutoMovieRenderAnalysisGap } from "./IAutoMovieRenderAnalysisGap";
import { IAutoMovieRenderInstanceSetCost } from "./IAutoMovieRenderInstanceSetCost";
import { IAutoMovieRenderModelCost } from "./IAutoMovieRenderModelCost";
import { IAutoMovieRenderOwnerCost } from "./IAutoMovieRenderOwnerCost";
import { IAutoMovieRenderTextureCost } from "./IAutoMovieRenderTextureCost";
import { IAutoMovieRenderTotals } from "./IAutoMovieRenderTotals";

/**
 * What one frame of a production actually costs the renderer, measured from the
 * compiled artifact rather than guessed from the design.
 *
 * The inventory is the evidence a budget is checked against, and it is
 * deliberately separate from that check so that a headless capture and a live
 * viewer can read one measurement instead of each counting for itself. The
 * render job's budget preflight measures it. Nothing on the viewer side does:
 * the viewer package answers the other question instead, counting what a scene
 * graph actually submitted, and nothing holds the two answers against each
 * other, so a disagreement between them is a defect the report could name
 * rather than one it does. Nothing here is an observation of a frame that was
 * drawn; these are the exact quantities the compiled artifact commits the
 * renderer to, so the numbers exist before any GPU does.
 *
 * The three per-kind arrays below are not a complete decomposition of the
 * totals. A cloth panel, a planting cluster and a water surface are none of a
 * model, a texture or an instance set, so their cost reaches a reader through
 * {@link totals}, {@link owners} and {@link gaps} alone; summing the arrays would
 * come up short by exactly the things a room is furnished with.
 *
 * @evidence requirements/rendering/budgets.md#rendering-frame-total-budget Exposes `IAutoMovieRenderInventory` as the portable data boundary for the rendering frame total budget requirement.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Types `IAutoMovieRenderInventory` for the spec render budget preflight system contract.
 * @author Samchon
 */
export interface IAutoMovieRenderInventory {
  /**
   * Inventory format.
   *
   * @evidence requirements/rendering/budgets.md#rendering-frame-total-budget Exposes `version` as the portable data boundary for the rendering frame total budget requirement.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Types `version` for the spec render budget preflight system contract.
   */
  version: 1;

  /**
   * Per-model geometry cost, ascending by model id.
   *
   * @evidence requirements/rendering/budgets.md#rendering-frame-total-budget Exposes `models` as the portable data boundary for the rendering frame total budget requirement.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Types `models` for the spec render budget preflight system contract.
   */
  models: IAutoMovieRenderModelCost[];

  /**
   * Unique texture assets cited by drawn materials, ascending by asset id.
   *
   * @evidence requirements/rendering/budgets.md#rendering-frame-total-budget Exposes `textures` as the portable data boundary for the rendering frame total budget requirement.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Types `textures` for the spec render budget preflight system contract.
   */
  textures: IAutoMovieRenderTextureCost[];

  /**
   * Per-instance-set batching cost, ascending by set id.
   *
   * @evidence requirements/rendering/budgets.md#rendering-frame-total-budget Exposes `instanceSets` as the portable data boundary for the rendering frame total budget requirement.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Types `instanceSets` for the spec render budget preflight system contract.
   */
  instanceSets: IAutoMovieRenderInstanceSetCost[];

  /**
   * Exact scalar totals; a metric with no measurement is `null`.
   *
   * @evidence requirements/rendering/budgets.md#rendering-frame-total-budget Exposes `totals` as the portable data boundary for the rendering frame total budget requirement.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Types `totals` for the spec render budget preflight system contract.
   */
  totals: IAutoMovieRenderTotals;

  /**
   * Owners of each metric's cost, ascending by owner id.
   *
   * The report bounds this into a short dominant-contributor list; the
   * inventory keeps the complete attribution so a consumer can sum it back to
   * the total.
   *
   * @evidence requirements/rendering/budgets.md#rendering-frame-total-budget Exposes `owners` as the portable data boundary for the rendering frame total budget requirement.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Types `owners` for the spec render budget preflight system contract.
   */
  owners: IAutoMovieRenderOwnerCost[];

  /**
   * Analyses that did not produce a number, and why.
   *
   * @evidence requirements/rendering/budgets.md#rendering-frame-total-budget Exposes `gaps` as the portable data boundary for the rendering frame total budget requirement.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Types `gaps` for the spec render budget preflight system contract.
   */
  gaps: IAutoMovieRenderAnalysisGap[];
}
