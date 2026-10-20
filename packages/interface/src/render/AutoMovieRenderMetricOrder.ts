/**
 * Every metric, in the fixed order a report lists them.
 *
 * The pure type package declares a tuple and the engine's runtime constant is typed against it; reports preserve this order for deterministic comparison.
 *
 * @evidence contracts/common.md#principled-implementation Literal tuple positions define the complete metric protocol order, and AUTOMOVIE_RENDER_METRICS uses that tuple as its runtime type so budget findings iterate the same bounded population.
 * @evidence contracts/common.md#clear-and-simple-design A type-only ordering contract permits one engine runtime array without adding values or runtime dependencies to interface.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The engine spells its array explicitly under this type rather than deriving values from erased types; no locale or inventory traversal order changes report position.
 * @evidence contracts/common.md#meaningful-documentation Defines complete fixed metric order and its type-only versus runtime ownership.
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
