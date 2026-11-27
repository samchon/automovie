/**
 * Stable formation import surface. Runtime state, geometry, placement and type
 * contracts live with their respective owners; the package exposes grouped
 * owner namespaces and the stable shared formation utilities.
 */
export {
  sampleFormationMotion,
  sampleFormationSlotMotion,
  selectFormationLod,
} from "@automovie/engine";
export type { IAutoMovieFormationViewerStats } from "../IAutoMovieFormationViewerStats.js";
export type { IAutoMovieFormationViewerObject } from "../IAutoMovieFormationViewerObject.js";


export { AutoMovieRenderFormation } from "./AutoMovieRenderFormation.js";
export { AutoMovieRenderFormationGeometry } from "../formationGeometry/index.js";
