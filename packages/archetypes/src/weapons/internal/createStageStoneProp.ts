import type { AutoMovieArchetypeStageStoneProp } from "../AutoMovieArchetypeStageStoneProp";
import { type AutoMovieArchetype } from "../../core/index";
import { StageTokenConstruction } from "../StageTokenConstruction";

import { stageTokenSphere } from "./stageTokenSphere";

/**
 * Stage stone silhouette.
 *
 * A stone-like digital sphere with the authored one-hand contact above the
 * support plane.
 *
 * @param params The scene id and this digital form's catalogue or sizing
 *   options.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function createStageStoneProp(
  params: AutoMovieArchetypeStageStoneProp.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeStageStoneProp.Affordance,
  AutoMovieArchetypeStageStoneProp.Dimension
> {
  return StageTokenConstruction("stone", params, seed, (builder, d, model) =>
    stageTokenSphere(builder, d, "stone", model),
  );
}
