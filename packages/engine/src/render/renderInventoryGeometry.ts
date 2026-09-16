/**
 * Geometry and material-asset measurements consumed by render inventory.
 * Model measurement memoizes one owned cost per model id and reconciles tier
 * attribution when the same model is drawn through several paths. Primitive
 * counts come from the engine tessellator; explicit buffers use declared strides.
 * Later instancing normalization may add resident RGB padding to that cost.
 * Texture enumeration deduplicates bindings; decoded dimensions are measured
 * by the inventory after all drawn and simulated materials have been collected.
 */
import type {
  AutoMovieTextureBinding,
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieRenderModelCost,
} from "@automovie/interface";

import { tessellate } from "../geometry/tessellate";
import { compareAutoMovieRenderIds } from "./renderDigest";
import {
  AUTOMOVIE_INDEX_BYTES,
  AUTOMOVIE_NORMAL_BYTES,
  AUTOMOVIE_POSITION_BYTES,
  AUTOMOVIE_SKIN_BYTES,
  AUTOMOVIE_UV_BYTES,
} from "./renderInventoryMetrics";

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

/**
 * Every distinct texture asset one material binds, ascending.
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Enumerates the bound texture assets whose decoded memory must be measured.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Closes material texture dependencies before dimensions and memory gaps are reported.
 */
export const texturesOf = (material: IAutoMovieMaterial): string[] => {
  const assets = new Set<string>();
  const bind = (binding: AutoMovieTextureBinding | null | undefined): void => {
    if (binding === null || binding === undefined) return;
    assets.add(typeof binding === "string" ? binding : binding.asset);
  };
  bind(material.baseColorTexture);
  bind(material.metallicRoughnessTexture);
  bind(material.normalTexture);
  bind(material.occlusionTexture);
  bind(material.emissiveTexture);
  return [...assets].sort(compareAutoMovieRenderIds);
};
