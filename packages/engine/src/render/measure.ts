import { tessellate } from "../geometry/tessellate";
import { AUTOMOVIE_INDEX_BYTES } from "./constants/AUTOMOVIE_INDEX_BYTES";
import { AUTOMOVIE_NORMAL_BYTES } from "./constants/AUTOMOVIE_NORMAL_BYTES";
import { AUTOMOVIE_POSITION_BYTES } from "./constants/AUTOMOVIE_POSITION_BYTES";
import { AUTOMOVIE_SKIN_BYTES } from "./constants/AUTOMOVIE_SKIN_BYTES";
import { AUTOMOVIE_UV_BYTES } from "./constants/AUTOMOVIE_UV_BYTES";
import { compareAutoMovieRenderIds } from "./compareAutoMovieRenderIds";
import { IAutoMovieModel, IAutoMovieRenderModelCost } from "@automovie/interface";

/**
 * Exact geometry cost of one model, memoized by model id.
 *
 * Primitives are measured by tessellating them with the engine's own
 * tessellator rather than by a table of formulas: a table would be a second
 * source of truth for how many triangles a sphere has, and the day the
 * tessellator's ring count changes, the budget would still be checking the old
 * number.
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Measures model geometry and resident attribute bytes once per shared model.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Supplies exact model costs and reconciles shared LOD attribution in the inventory cache.
 */
export const measure = (
  model: IAutoMovieModel,
  cache: Map<string, IAutoMovieRenderModelCost>,
  tier?: "hero" | "near" | "far",
): IAutoMovieRenderModelCost => {
  const cached = cache.get(model.id);
  if (cached !== undefined) {
    // A model cited by several level-of-detail tiers, or by both a tier and a
    // plain scene node, has no single tier to report.
    if (cached.tier !== (tier ?? null)) cached.tier = null;
    return cached;
  }
  let vertices = 0;
  let triangles = 0;
  let geometryBytes = 0;
  const materials = new Set<string>();
  for (const part of model.parts) {
    if (part.material !== null) materials.add(part.material);
    if (part.geometry.type === "primitive") {
      const mesh = tessellate(part.geometry.shape);
      const count = mesh.positions.length / 3;
      vertices += count;
      triangles += mesh.indices.length / 3;
      geometryBytes +=
        count * (AUTOMOVIE_POSITION_BYTES + AUTOMOVIE_NORMAL_BYTES) +
        mesh.indices.length * AUTOMOVIE_INDEX_BYTES;
      continue;
    }
    const mesh = part.geometry.mesh;
    const count = mesh.positions.length / 3;
    vertices += count;
    triangles += mesh.indices === null ? count / 3 : mesh.indices.length / 3;
    geometryBytes +=
      count *
        (AUTOMOVIE_POSITION_BYTES +
          (mesh.normals === null ? 0 : AUTOMOVIE_NORMAL_BYTES) +
          (mesh.uvs === null ? 0 : AUTOMOVIE_UV_BYTES) +
          (mesh.colors === undefined ? 0 : 3 * Float32Array.BYTES_PER_ELEMENT) +
          (mesh.skin === null ? 0 : AUTOMOVIE_SKIN_BYTES)) +
      (mesh.indices === null ? 0 : mesh.indices.length) * AUTOMOVIE_INDEX_BYTES;
  }
  const cost: IAutoMovieRenderModelCost = {
    model: model.id,
    tier: tier ?? null,
    parts: model.parts.length,
    vertices,
    triangles,
    materials: [...materials].sort(compareAutoMovieRenderIds),
    geometryBytes,
  };
  cache.set(model.id, cost);
  return cost;
};
