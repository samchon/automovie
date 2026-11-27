import { AutoMovieArchetypeStationery } from "../AutoMovieArchetypeStationery";
import { ArchetypeDraw, type AutoMovieArchetype } from "../../core/index";
import "../StationeryDraw";
import "../AutoMovieArchetypeBook";
import "../createClipboard";
import { createPaper } from "../createPaper";
import "../AutoMovieArchetypePen";

/**
 * Read a saved stationery recipe and call the producer for its kind.
 *
 * @param params The saved kind, fixed values, optional identifier and model
 *   when applicable.
 * @param seed The seed that draws the saved dimensions and model, or undefined
 *   for the original defaults.
 * @returns The selected prop in its original frame.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
 *   outside its admitted recipe.
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
    return createPaper(
      { ...params, format: AutoMovieArchetypeStationery.PRODUCER_VARIANTS[kind] },
      seed,
    );

  // The saved input spans every variant. The selected producer checks its original recipe.
  return AutoMovieArchetypeStationery.PRODUCERS[kind](params, seed);
}
