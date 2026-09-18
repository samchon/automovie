import { AutoMovieRenderMetricOrder } from "@automovie/interface";

/**
 * Every metric, in the fixed order a report lists them.
 *
 * The single runtime spelling of `AutoMovieRenderMetricOrder`. A report always
 * carries all of them, which is what makes its length independent of the
 * production and what stops an unmeasured cost from disappearing instead of
 * being reported as unmeasured.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Enumerates every geometry, memory, light, instance, and simulation metric that a render budget must account for.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Fixes the complete metric order used by the worst-case preflight inventory and report.
 */
export const AUTOMOVIE_RENDER_METRICS: Readonly<AutoMovieRenderMetricOrder> = [
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
