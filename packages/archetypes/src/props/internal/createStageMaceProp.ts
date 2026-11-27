import type { AutoMovieArchetypeStageMaceProp } from "../AutoMovieArchetypeStageMaceProp";
import { AutoMovieEngineVector3 } from "@automovie/engine";

import { type AutoMovieArchetype } from "../../core/index";
import { StageShaftConstruction } from "./StageShaftConstruction";


/*
 * Padded round-headed stage prop.
 *
 * A display form with a round ornament above a one-hand shaft grip. Its origin
 * is at the shaft base.
 * Parameter params: The scene identity and optional total display height in metres.
 * Parameter seed: Uses the original named draw session to resolve omitted settings.
 * Returns: The digital model and its authored contact frames.
 * For inputs the selected catalogue profile
 * cannot use.
 */
export function createStageMaceProp(
  params: AutoMovieArchetypeStageMaceProp.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeStageMaceProp.Affordance,
  AutoMovieArchetypeStageMaceProp.Dimension
> {
  return StageShaftConstruction(
    "mace",
    params,
    seed,
    0.8,
    (builder, height) => {
      const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
      const radius: number = 0.115 * height;
      builder.ball("ornament", radius, v(0, height - radius, 0), {
        color: "#968ccc",
      });
    },
  );
}
