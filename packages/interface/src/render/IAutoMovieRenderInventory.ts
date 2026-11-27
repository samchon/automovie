import type { IAutoMovieRenderAnalysisGap } from "./IAutoMovieRenderAnalysisGap";
import type { IAutoMovieRenderInstanceSetCost } from "./IAutoMovieRenderInstanceSetCost";
import type { IAutoMovieRenderModelCost } from "./IAutoMovieRenderModelCost";
import type { IAutoMovieRenderOwnerCost } from "./IAutoMovieRenderOwnerCost";
import type { IAutoMovieRenderTextureCost } from "./IAutoMovieRenderTextureCost";
import type { IAutoMovieRenderTotals } from "./IAutoMovieRenderTotals";

/**
 * Compiled-artifact preflight counts, submission bounds and resource estimates
 * for render-budget evaluation.
 *
 * The inventory is separate from budget verdict and live renderer observations.
 * Some metrics count exact populations, while others bound submissions or
 * estimate device allocation under their stated input premises.
 * AutoMovieRenderBudgetPreflight.auditObservation can compare available observations with
 * report bounds, but currently has only test callers in this repository; it is
 * not a wired capture audit.
 *
 * The three per-kind arrays below are not a complete decomposition of the
 * totals. A cloth panel, a planting cluster and a water surface are none of a
 * model, a texture or an instance set, so their cost reaches a reader through
 * {@link totals}, {@link owners} and {@link gaps} alone; summing the arrays would
 * come up short by exactly the things a room is furnished with.
 */
export interface IAutoMovieRenderInventory {
  /** Inventory format. */
  version: 1;

  /** Per-model geometry cost, ascending by model id. */
  models: IAutoMovieRenderModelCost[];

  /**
   * Resident upload variants, environment derivatives and runtime
   * targets/lookups, sorted by asset, variant and owner keys; several rows may
   * share one asset.
   */
  textures: IAutoMovieRenderTextureCost[];

  /** Per-instance-set batching cost, ascending by set id. */
  instanceSets: IAutoMovieRenderInstanceSetCost[];

  /**
   * Per-metric counts, bounds or estimates; null means no admitted measurement
   * for that metric.
   */
  totals: IAutoMovieRenderTotals;

  /**
   * Owners of each metric's cost, ascending by owner id.
   *
   * The report bounds this into a short dominant-contributor list; the
   * inventory keeps the complete attribution so a consumer can sum it back to
   * the total.
   */
  owners: IAutoMovieRenderOwnerCost[];

  /** Analyses that did not produce a number, and why. */
  gaps: IAutoMovieRenderAnalysisGap[];
}
