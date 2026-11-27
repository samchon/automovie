import { AutoMovieArchetypeSmoking } from "../AutoMovieArchetypeSmoking";
import { ArchetypeDraw, type AutoMovieArchetype } from "../../core/index";
import "./SmokingPropDraw";
import "../AutoMovieArchetypeCigarette";
import "../AutoMovieArchetypeLighter";

/*
 * Read a saved smoking prop recipe and call the producer for its kind.
 * Parameter params: The saved kind, fixed values, optional identifier and model
 * when applicable.
 * Parameter seed: The seed that draws the saved dimensions and model, or undefined
 * for the original defaults.
 * Returns: The selected prop in its original frame.
 * When the model or a fixed parameter lies
 * outside its admitted recipe.
 */
export function createSmoking(
  params: AutoMovieArchetypeSmoking.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeSmoking.Affordance, AutoMovieArchetypeSmoking.Dimension> {
  const kind: AutoMovieArchetypeSmoking.Kind = ArchetypeDraw.choice(
    "smoking",
    "kind",
    params.kind,
    AutoMovieArchetypeSmoking.KINDS,
  );

  // The saved input spans every variant. The selected producer checks its original recipe.
  return AutoMovieArchetypeSmoking.PRODUCERS[kind](params, seed);
}
