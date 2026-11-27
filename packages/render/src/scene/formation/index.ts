/**
 * Stable formation import surface. Runtime state, geometry, placement and type
 * contracts live with their respective owners; the package exposes grouped
 * owner namespaces and the stable shared formation utilities.
 */
export { AutoMovieEnginePopulationFormation } from "@automovie/engine";
export type { IAutoMovieFormationViewerStats } from "../IAutoMovieFormationViewerStats.js";
export type { IAutoMovieFormationViewerObject } from "../IAutoMovieFormationViewerObject.js";


export * from "../AutoMovieRenderFormation.js";
export { AutoMovieRenderFormationGeometry } from "../formationGeometry/index.js";
