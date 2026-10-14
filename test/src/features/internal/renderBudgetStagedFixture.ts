import { IAutoMovieScene } from "@automovie/interface";

import { renderBudgetPoseFixture as pose } from "./renderBudgetPoseFixture";

/** Stage one named model at the resource-budget fixture's identity placement. */
export const renderBudgetStagedFixture = (
  id: string,
  model: string,
): IAutoMovieScene["nodes"][number] => ({
  id,
  model,
  transform: pose(),
  motion: null,
  pose: null,
});
