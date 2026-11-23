/**
 * Every metric, in the fixed order a report lists them.
 *
 * The pure type package declares a tuple and the engine's runtime constant is
 * typed against it; reports preserve this order for deterministic comparison.
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
