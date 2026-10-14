import { AutoMovieRenderMetricOrder } from "@automovie/interface";

/**
 * Every metric, in the fixed order a report lists them.
 *
 * The single runtime spelling of `AutoMovieRenderMetricOrder`. A report always
 * carries all of them, which is what makes its length independent of the
 * production and what stops an unmeasured cost from disappearing instead of
 * being reported as unmeasured.
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
