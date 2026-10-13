import { IAutoMovieRenderAnalysisGap } from "./IAutoMovieRenderAnalysisGap";
import { IAutoMovieRenderInstanceSetCost } from "./IAutoMovieRenderInstanceSetCost";
import { IAutoMovieRenderModelCost } from "./IAutoMovieRenderModelCost";
import { IAutoMovieRenderOwnerCost } from "./IAutoMovieRenderOwnerCost";
import { IAutoMovieRenderTextureCost } from "./IAutoMovieRenderTextureCost";
import { IAutoMovieRenderTotals } from "./IAutoMovieRenderTotals";

/**
 * What one frame of a production actually costs the renderer, measured from the compiled artifact rather than guessed from the design.
 *
 * The inventory is the evidence a budget is checked against, and it is deliberately separate from that check so that a headless capture and a live viewer can read one measurement instead of each counting for itself. The render job's budget preflight measures it. Nothing on the viewer side does: the viewer package answers the other question instead, counting what a scene graph actually submitted, and nothing holds the two answers against each other, so a disagreement between them is a defect the report could name rather than one it does. Nothing here is an observation of a frame that was drawn; these are the exact quantities the compiled artifact commits the renderer to, so the numbers exist before any GPU does.
 *
 * The three per-kind arrays below are not a complete decomposition of the totals. A cloth panel, a planting cluster and a water surface are none of a model, a texture or an instance set, so their cost reaches a reader through {@link totals}, {@link owners} and {@link gaps} alone; summing the arrays would come up short by exactly the things a room is furnished with.
 *
 * @evidence contracts/common.md#principled-implementation Engine inventory measures compiled drawable and resource populations, retaining exact counts, conservative submission/geometry peaks and conservative device-byte estimates with null totals for missing certified input.
 * @evidence contracts/common.md#clear-and-simple-design Per-kind rows aid inspection while complete totals, attribution and gaps also include simulations and frame-wide renderer work that those rows do not decompose.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This inventory is preflight rather than observed GPU work, and summing only models/textures/instanceSets omits simulated costs; actual capture audit separately compares the observable metrics with these bounds.
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

  /** Exact scalar totals; a metric with no measurement is `null`. */
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
