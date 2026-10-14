import { IAutoMovieRenderAnalysisGap } from "./IAutoMovieRenderAnalysisGap";
import { IAutoMovieRenderInstanceSetCost } from "./IAutoMovieRenderInstanceSetCost";
import { IAutoMovieRenderModelCost } from "./IAutoMovieRenderModelCost";
import { IAutoMovieRenderOwnerCost } from "./IAutoMovieRenderOwnerCost";
import { IAutoMovieRenderTextureCost } from "./IAutoMovieRenderTextureCost";
import { IAutoMovieRenderTotals } from "./IAutoMovieRenderTotals";

/**
 * Compiled-artifact preflight counts, submission bounds and resource estimates for render-budget evaluation.
 *
 * The inventory is separate from budget verdict and live renderer observations. Some metrics count exact populations, while others bound submissions or estimate device allocation under their stated input premises. auditAutoMovieRenderObservation can compare available observations with report bounds, but currently has only test callers in this repository; it is not a wired capture audit.
 *
 * The three per-kind arrays below are not a complete decomposition of the totals. A cloth panel, a planting cluster and a water surface are none of a model, a texture or an instance set, so their cost reaches a reader through {@link totals}, {@link owners} and {@link gaps} alone; summing the arrays would come up short by exactly the things a room is furnished with.
 *
 * @evidence contracts/common.md#principled-implementation Engine inventory measures compiled drawable and resource populations, retaining exact counts, conservative submission/geometry peaks and conservative device-byte estimates with null totals for missing certified input.
 * @evidence contracts/common.md#clear-and-simple-design Per-kind rows aid inspection while complete totals, attribution and gaps also include simulations and frame-wide renderer work that those rows do not decompose.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Preflight is not observed GPU work and per-kind rows omit simulated costs. The separately available observation-audit helper currently has no repository product caller; this type creates neither runtime comparison nor a measured frame.
 * @evidence contracts/common.md#meaningful-documentation Defines preflight source, each sorted population, complete totals and owner/gap accounting and the distinction from already-drawn frame observations.
 * @author Samchon
 */
export interface IAutoMovieRenderInventory {
  /** Inventory format. */
  version: 1;

  /** Per-model geometry cost, ascending by model id. */
  models: IAutoMovieRenderModelCost[];

  /** Unique texture assets cited by drawn materials, ascending by asset id. */
  textures: IAutoMovieRenderTextureCost[];

  /** Per-instance-set batching cost, ascending by set id. */
  instanceSets: IAutoMovieRenderInstanceSetCost[];

  /** Per-metric counts, bounds or estimates; null means no admitted measurement for that metric. */
  totals: IAutoMovieRenderTotals;

  /**
   * Owners of each metric's cost, ascending by owner id.
   *
   * The report bounds this into a short dominant-contributor list; the inventory keeps the complete attribution so a consumer can sum it back to the total.
   */
  owners: IAutoMovieRenderOwnerCost[];

  /** Analyses that did not produce a number, and why. */
  gaps: IAutoMovieRenderAnalysisGap[];
}
