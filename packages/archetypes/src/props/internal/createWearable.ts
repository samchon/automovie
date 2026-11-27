import { AutoMovieArchetypeWearable } from "../AutoMovieArchetypeWearable";
import {
  type AutoMovieArchetype,
} from "../../core/index";
import {
  ArchetypeDraw,
} from "../../core/internal/ArchetypeDraw";
import "./WornPropDraw";
import "../AutoMovieArchetypeCyclingHelmet";
import "../AutoMovieArchetypeHat";
import "../AutoMovieArchetypeSpectacles";
import "../AutoMovieArchetypeWatch";

/*
 * Read a saved wearable recipe and call the producer for its kind.
 * Parameter params: The saved kind, fixed values, optional identifier and model
 * when applicable.
 * Parameter seed: The seed that draws the saved dimensions and model, or undefined
 * for the original defaults.
 * Returns: The selected prop in its original frame.
 * When the model or a fixed parameter lies
 * outside its admitted recipe.
 */
export function createWearable(
  params: AutoMovieArchetypeWearable.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeWearable.Affordance, AutoMovieArchetypeWearable.Dimension> {
  const kind: AutoMovieArchetypeWearable.Kind = ArchetypeDraw.choice(
    "wearable",
    "kind",
    params.kind,
    AutoMovieArchetypeWearable.KINDS,
  );

  // The saved input spans every variant. The selected producer checks its original recipe.
  return AutoMovieArchetypeWearable.PRODUCERS[kind](params, seed);
}
