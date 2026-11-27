import type { AutoMovieArchetypeStageBallProp } from "../AutoMovieArchetypeStageBallProp";
import { type AutoMovieArchetype } from "../../core/index";
import { StageTokenConstruction } from "./StageTokenConstruction";

import { stageTokenSphere } from "./stageTokenSphere";

/*
 * Small round display token.
 *
 * A sphere resting on the floor below a single precision handle at its centre.
 * Parameter params: The scene id and this digital form's catalogue or sizing
 * options.
 * Parameter seed: Uses the original named draw session to resolve omitted settings.
 * Returns: The digital model and its authored contact frames.
 * For inputs the selected catalogue profile
 * cannot use.
 */
export function createStageBallProp(
  params: AutoMovieArchetypeStageBallProp.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeStageBallProp.Affordance,
  AutoMovieArchetypeStageBallProp.Dimension
> {
  return StageTokenConstruction("ball", params, seed, (builder, d, model) =>
    stageTokenSphere(builder, d, "ball", model),
  );
}
