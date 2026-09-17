/**
 * Storage strides and report ordering shared by render inventory phases.
 * The public inventory module re-exports these constants for existing consumers.
 * Strides describe the renderer's declared device layout in bytes, not source
 * JSON size or per-instance memory. Geometry and simulation owners apply them;
 * keeping one definition makes report aggregation and budget order agree.
 */
import type { AutoMovieRenderMetricOrder } from "@automovie/interface";

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

/**
 * Device bytes of one vertex position: three 32-bit floats.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Accounts for the position-buffer component of geometry memory.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Supplies the fixed position stride used by worst-case geometry accounting.
 */
export const AUTOMOVIE_POSITION_BYTES = 12;

/**
 * Device bytes of one vertex normal: three 32-bit floats.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Accounts for the normal-buffer component of geometry memory.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Supplies the fixed normal stride used by worst-case geometry accounting.
 */
export const AUTOMOVIE_NORMAL_BYTES = 12;

/**
 * Device bytes of one texture coordinate pair: two 32-bit floats.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Accounts for the texture-coordinate component of geometry memory.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Supplies the fixed UV stride used by worst-case geometry accounting.
 */
export const AUTOMOVIE_UV_BYTES = 8;

/**
 * Device bytes of one triangle index: one 32-bit unsigned integer.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Accounts for indexed-triangle storage in geometry memory.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Supplies the fixed index stride used by worst-case geometry accounting.
 */
export const AUTOMOVIE_INDEX_BYTES = 4;

/**
 * Device bytes of one vertex's skin binding: four 16-bit joint indices and four
 * 32-bit weights, the glTF four-influence convention the mesh type documents.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Includes joint and weight attributes in skinned-geometry memory rather than counting only positions.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Supplies the declared four-influence stride for conservative geometry accounting.
 */
export const AUTOMOVIE_SKIN_BYTES = 24;

/**
 * Device bytes of one RGBA8 texel.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Converts decoded RGBA8 dimensions into the texture-memory budget.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Supplies the texel stride used by texture closure accounting.
 */
export const AUTOMOVIE_TEXEL_BYTES = 4;

/**
 * Device bytes of one vertex's free-surface flow vector: two 32-bit floats.
 *
 * A drawn water surface carries this attribute beside position, normal and
 * texture coordinate, and a ripple shader scrolls along it. Leaving it out
 * would understate the one buffer a pond has that a wall does not.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Includes the water-only flow attribute in geometry memory instead of undercounting simulated surfaces.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Supplies the explicit free-surface flow stride for worst-case preflight accounting.
 */
export const AUTOMOVIE_FLOW_BYTES = 8;
