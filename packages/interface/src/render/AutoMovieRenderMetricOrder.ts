/**
 * Every metric, in the fixed order a report lists them.
 *
 * A pure type package cannot hold a runtime array, so the ordering lives here
 * as a tuple type and the engine derives its single runtime constant from it.
 * Report order is fixed so two reports of the same production diff line by
 * line.
 *
 * @evidence requirements/rendering/budgets.md#rendering-runtime-budget-enforcement Exposes `AutoMovieRenderMetricOrder` as the portable data boundary for the rendering runtime budget enforcement requirement.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Types `AutoMovieRenderMetricOrder` for the spec render budget preflight system contract.
 */
export type AutoMovieRenderMetricOrder = [
  "triangles",
  "vertices",
  "drawCalls",
  "materials",
  "textures",
  "textureBytes",
  "geometryBytes",
  "lights",
  "shadowMaps",
  "nodes",
  "instanceSets",
  "instanceSlots",
  "instanceChunks",
  "fluidCells",
  "fluidParticles",
];
