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
export type { IAutoMovieFormationViewerStats } from "../IAutoMovieFormationViewerStats.js";
export type { IAutoMovieFormationViewerObject } from "../IAutoMovieFormationViewerObject.js";
export { buildInstancedFormation } from "../buildInstancedFormation.js";
export { regenerateFormationSlot } from "../regenerateFormationSlot.js";
export {
  flattenInstancedModel,
  flattenInstancedObject,
} from "../formationGeometry/index.js";
