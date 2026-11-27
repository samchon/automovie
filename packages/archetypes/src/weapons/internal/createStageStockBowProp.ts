import type { AutoMovieArchetypeStageStockBowProp } from "../AutoMovieArchetypeStageStockBowProp";
import { type AutoMovieArchetype } from "../../core/index";
import { StageBowConstruction } from "./StageBowConstruction";
import { buildCrossbow } from "./buildCrossbow";


/*
 * Stock-mounted bow silhouette for screen staging.
 *
 * A digital display model with a stock, visible spanning curve and posed actor
 * contact marks.
 * Parameter params: The scene identity and optional dimensions for the display
 * silhouette.
 * Parameter seed: Uses the original named draw session to resolve omitted settings.
 * Returns: The digital model and its authored contact frames.
 * For inputs the selected catalogue profile
 * cannot use.
 */
export function createStageStockBowProp(
  params: AutoMovieArchetypeStageStockBowProp.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeStageStockBowProp.Affordance,
  AutoMovieArchetypeStageStockBowProp.Dimension
> {
  return StageBowConstruction("crossbow", params, seed, buildCrossbow);
}
