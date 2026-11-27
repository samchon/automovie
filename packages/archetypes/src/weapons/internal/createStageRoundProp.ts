import type { AutoMovieArchetypeStageRoundProp } from "../AutoMovieArchetypeStageRoundProp";
import { type AutoMovieArchetype } from "../../core/index";
import { StageTokenConstruction } from "./StageTokenConstruction";

import { stageTokenSphere } from "./stageTokenSphere";

/*
 * Heavy round display silhouette.
 *
 * A round, floor-supported stage form with its model-space two-hand contact at
 * the centre.
 * Parameter params: The scene id and this digital form's catalogue or sizing
 * options.
 * Parameter seed: Uses the original named draw session to resolve omitted settings.
 * Returns: The digital model and its authored contact frames.
 * For inputs the selected catalogue profile
 * cannot use.
 */
export function createStageRoundProp(
  params: AutoMovieArchetypeStageRoundProp.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeStageRoundProp.Affordance,
  AutoMovieArchetypeStageRoundProp.Dimension
> {
  return StageTokenConstruction(
    "roundShot",
    params,
    seed,
    (builder, d, model) => stageTokenSphere(builder, d, "roundShot", model),
  );
}
