import {
  IAutoMovieMesh,
  IAutoMovieModel,
  IAutoMovieRenderModelCost,
} from "@automovie/interface";

import { tessellate } from "../geometry/tessellate";
import type { ITessellation } from "./../geometry/ITessellation";
import { compareAutoMovieRenderIds } from "./compareAutoMovieRenderIds";
import { AUTOMOVIE_INDEX_BYTES } from "./constants/AUTOMOVIE_INDEX_BYTES";
import { AUTOMOVIE_NORMAL_BYTES } from "./constants/AUTOMOVIE_NORMAL_BYTES";
import { AUTOMOVIE_POSITION_BYTES } from "./constants/AUTOMOVIE_POSITION_BYTES";
import { AUTOMOVIE_SKIN_BYTES } from "./constants/AUTOMOVIE_SKIN_BYTES";
import { AUTOMOVIE_UV_BYTES } from "./constants/AUTOMOVIE_UV_BYTES";

/**
 * Exact geometry cost of one model, memoized by model id.
 *
 * Primitives are measured by tessellating them with the engine's own
 * tessellator rather than by a table of formulas: a table would be a second
 * source of truth for how many triangles a sphere has, and the day the
 * tessellator's ring count changes, the budget would still be checking the old
 * number.
 *
 * @evidence contracts/common.md#principled-implementation Measure actual primitive tessellation or mesh attribute/index lengths into the declared geometry byte model; a request-owned model-id cache shares equivalent model costs and clears tier attribution when citations disagree.
 * @evidence contracts/common.md#clear-and-simple-design This canonical prototype measurement owns topology/attribute arithmetic while population multipliers and frame passes remain in inventory phases.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Primitive counts come from tessellate rather than a second formula table; model ids must uniquely denote unchanged definitions for the cache lifetime. Bytes describe the declared prototype buffer profile, not every native clone or instance stream.
 * @evidence contracts/common.md#meaningful-documentation Docs identify shared model cost, canonical tessellation and tier ambiguity; cached rows are mutable request-owned records returned by reference.
 * @evidence contracts/performance.md#efficient-algorithms First measurement scans P parts and generated vertex/index output, retaining one cost/material-id set; later equivalent id citations are expected O(1) lookups. Primitive tessellation allocations are included in the first cost.
 * @evidence contracts/performance.md#reuse-equivalent-work One inventory-owned cache shares prototype measurement across nodes, prototypes and tiers; it is never reused across a different mutable subject or model definition.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The cache owner releases all cost rows at request end; temporary tessellations are not retained, and this function opens no native geometry handle.
 */
export const measure: (
  model: IAutoMovieModel,
  cache: Map<string, IAutoMovieRenderModelCost>,
  tier?: "hero" | "near" | "far",
) => IAutoMovieRenderModelCost = (
  model: IAutoMovieModel,
  cache: Map<string, IAutoMovieRenderModelCost>,
  tier?: "hero" | "near" | "far",
): IAutoMovieRenderModelCost => {
  const cached: IAutoMovieRenderModelCost | undefined = cache.get(model.id);
  if (cached !== undefined) {
    // A model cited by several level-of-detail tiers, or by both a tier and a
    // plain scene node, has no single tier to report.
    if (cached.tier !== (tier ?? null)) cached.tier = null;
    return cached;
  }
  let vertices: number = 0;
  let triangles: number = 0;
  let geometryBytes: number = 0;
  const materials: Set<string> = new Set<string>();
  for (const part of model.parts) {
    if (part.material !== null) materials.add(part.material);
    if (part.geometry.type === "primitive") {
      const mesh: ITessellation = tessellate(part.geometry.shape);
      const count: number = mesh.positions.length / 3;
      vertices += count;
      triangles += mesh.indices.length / 3;
      geometryBytes +=
        count * (AUTOMOVIE_POSITION_BYTES + AUTOMOVIE_NORMAL_BYTES) +
        mesh.indices.length * AUTOMOVIE_INDEX_BYTES;
      continue;
    }
    const mesh: IAutoMovieMesh = part.geometry.mesh;
    const count: number = mesh.positions.length / 3;
    vertices += count;
    triangles += mesh.indices === null ? count / 3 : mesh.indices.length / 3;
    geometryBytes +=
      count *
        (AUTOMOVIE_POSITION_BYTES +
          (mesh.normals === null ? 0 : AUTOMOVIE_NORMAL_BYTES) +
          (mesh.uvs === null ? 0 : AUTOMOVIE_UV_BYTES) +
          (mesh.colors === undefined ? 0 : 3 * Float32Array.BYTES_PER_ELEMENT) +
          (mesh.reliefWeights === undefined
            ? 0
            : Float32Array.BYTES_PER_ELEMENT) +
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
