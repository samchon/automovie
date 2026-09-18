import { IAutoMoviePlantingCluster, IAutoMoviePlantingDomain } from "@automovie/interface";
import { IAutoMovieRenderPrototypeCost } from "./IAutoMovieRenderPrototypeCost";

/**
 * One planting cluster drawn as instanced branch and leaf batches.
 *
 * @evidence requirements/rendering/budgets.md#rendering-expansion-bounds Groups the compact member count and prototype bounds without materializing every plant node.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Defines the planting input used to report exact batch counts and bounded geometry.
 */
export interface IAutoMovieRenderPlanting {
  /**
   * The recipe every member of the cluster instances.
   *
   * @evidence requirements/rendering/budgets.md#rendering-expansion-bounds Supplies the shared branching recipe whose expansion is bounded once per cluster.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Keeps prototype structure explicit in compact planting preflight.
   */
  domain: IAutoMoviePlantingDomain;

  /**
   * The cluster placing the members.
   *
   * @evidence requirements/rendering/budgets.md#rendering-expansion-bounds Supplies the exact planting population and chunk inputs to budget accounting.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Computes batching cost from the compact cluster rather than expanded nodes.
   */
  cluster: IAutoMoviePlantingCluster;

  /**
   * Semantic id of the owning building space, or `null` when unowned.
   *
   * @evidence requirements/rendering/budgets.md#rendering-budget-decision Names the editable space responsible for planting cost.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Attributes a compact cluster to the dominant-owner recovery report.
   */
  owner: string | null;

  /**
   * Material id of the branch batch, or `null` for the default.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Includes the branch batch's material and draw-call contribution.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Prices the declared branch binding independently of leaf presentation.
   */
  branchMaterial: string | null;

  /**
   * Material id of the leaf batch, or `null` for the default.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Includes the leaf batch's material and draw-call contribution.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Prices the declared leaf binding independently of branch presentation.
   */
  leafMaterial: string | null;

  /**
   * Drawn cost of one branch instance, or `null` when the caller did not state
   * it.
   *
   * A branch is drawn as whatever solid the renderer chooses to sweep along it,
   * and that choice is not in the recipe: the same derived plant is a six-sided
   * tube in one viewer and a twenty-sided one in another. So the engine refuses
   * to invent a number here, exactly as it refuses to invent texture bytes, and
   * an absent cost makes the geometry metrics `not-run` while the batching
   * metrics stay exact.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Supplies the per-branch vertex and triangle bound used across the cluster population.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Makes renderer-chosen branch geometry explicitly not-run when no prototype cost is supplied.
   */
  branch: IAutoMovieRenderPrototypeCost | null;

  /**
   * Drawn cost of one leaf instance, or `null` when the caller did not state
   * it. A recipe bearing no leaves draws no leaf batch, so its absence costs
   * nothing and reports no gap.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Supplies the per-leaf vertex and triangle bound only for recipes that draw leaves.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Distinguishes a leafless recipe from an unmeasured leaf prototype.
   */
  leaf: IAutoMovieRenderPrototypeCost | null;
}
