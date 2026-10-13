import type { AutoMoviePopulationScope } from "./AutoMoviePopulationScope";
import { createAutoMoviePopulationFiles } from "./createAutoMoviePopulationFiles";
import type { AutoMovieProductionContractLayer } from "./createAutoMovieProductionContractClaim";

/**
 * Selects the complete authored file population compared by a layer account.
 */
export function createAutoMovieAuthoredPopulationFiles(
  layer: AutoMovieProductionContractLayer,
  scope: AutoMoviePopulationScope,
): string[] {
  if (layer === "treatments" || layer === "scripts" || layer === "screenplays")
    return createAutoMoviePopulationFiles(layer, scope);
  return [`${layer}/**/*.md`];
}
