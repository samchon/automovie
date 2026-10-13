import { evaluateAutoMovieRenderBudget } from "@automovie/engine";
import { IAutoMovieRenderBudget, IAutoMovieRenderInventory, IAutoMovieRenderReport, IAutoMovieRenderTarget } from "@automovie/interface";

/** Evaluate an inventory against a fixed empty semantic palette and the caller's sealed target. */
export const evaluateRenderBudgetFixture = (
  inventory: IAutoMovieRenderInventory,
  budget: IAutoMovieRenderBudget | null,
  target: IAutoMovieRenderTarget,
  maxContributors?: number,
): IAutoMovieRenderReport =>
  evaluateAutoMovieRenderBudget({
    inventory,
    budget,
    mask: {
      version: 2,
      protocol: "automovie.semantic-mask.v2",
      background: "#000000",
      entries: [],
      unaddressed: [],
      digest: `sha256:${"0".repeat(64)}`,
    },
    target,
    maxContributors,
  });
