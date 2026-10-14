import type { IAutoMovieRenderBudget } from "@automovie/interface";

/** Return the existing caller-authored tier and limits without deriving an expected verdict. */
export function renderBudgetFixture(props: {
  tier: string;
  limits: IAutoMovieRenderBudget["limits"];
}): IAutoMovieRenderBudget {
  return { version: 1, tier: props.tier, limits: props.limits };
}
