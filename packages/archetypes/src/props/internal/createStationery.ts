import { AutoMovieArchetypeStationery } from "../AutoMovieArchetypeStationery";
import {
  type AutoMovieArchetype,
} from "../../core/index";
import {
  ArchetypeDraw,
} from "../../core/internal/ArchetypeDraw";
import "./StationeryDraw";
import "../AutoMovieArchetypeBook";
import "../AutoMovieArchetypeClipboard";
import { AutoMovieArchetypePaper } from "../AutoMovieArchetypePaper";
import "../AutoMovieArchetypePen";

/*
 * Read a saved stationery recipe and call the producer for its kind.
 * Parameter params: The saved kind, fixed values, optional identifier and model
 * when applicable.
 * Parameter seed: The seed that draws the saved dimensions and model, or undefined
 * for the original defaults.
 * Returns: The selected prop in its original frame.
 * When the model or a fixed parameter lies
 * outside its admitted recipe.
 */
export function createStationery(
  params: AutoMovieArchetypeStationery.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeStationery.Affordance, AutoMovieArchetypeStationery.Dimension> {
  const kind: AutoMovieArchetypeStationery.Kind = ArchetypeDraw.choice(
    "stationery",
    "kind",
    params.kind,
    AutoMovieArchetypeStationery.KINDS,
  );
  if (kind === "paper" || kind === "map")
    return AutoMovieArchetypePaper.create(
      { ...params, format: AutoMovieArchetypeStationery.PRODUCER_VARIANTS[kind] },
      seed,
    );

  // The saved input spans every variant. The selected producer checks its original recipe.
  return AutoMovieArchetypeStationery.PRODUCERS[kind](params, seed);
}
