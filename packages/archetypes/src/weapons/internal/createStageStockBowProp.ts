import type { AutoMovieArchetypeStageStockBowProp } from "../AutoMovieArchetypeStageStockBowProp";
import { type AutoMovieArchetype } from "../../core/index";
import { StageBowConstruction } from "../StageBowConstruction";
import { buildCrossbow } from "./buildCrossbow";


/**
 * Stock-mounted bow silhouette for screen staging.
 *
 * A digital display model with a stock, visible spanning curve and posed actor
 * contact marks.
 *
 * @param params The scene identity and optional dimensions for the display
 *   silhouette.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
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
