/**
 * Stable formation import surface. Runtime state, geometry, placement and type
 * contracts live with their respective owners; these exports preserve existing
 * callers without introducing another implementation or a forwarding function.
 */
export {
  sampleFormationMotion,
  sampleFormationSlotMotion,
  selectFormationLod,
} from "@automovie/engine";
export type {
  IAutoMovieFormationLodInput,
  IAutoMovieFormationLodSelection,
} from "@automovie/engine";
export type {
  IAutoMovieFormationViewerStats,
  IAutoMovieFormationViewerObject,
} from "./formationTypes";
export { buildInstancedFormation } from "./formationRuntime";
export { regenerateFormationSlot } from "./formationPlacement";
export {
  flattenInstancedModel,
  flattenInstancedObject,
} from "./formationGeometry";
