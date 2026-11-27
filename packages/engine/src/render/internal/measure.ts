import {
  IAutoMovieMesh,
  IAutoMovieModel,
  type IAutoMovieRealizeGeometry,
  IAutoMovieRenderModelCost,
} from "@automovie/interface";

import { realizeAutoMovieGeometry } from "../../geometry/internal/realizeAutoMovieGeometry";
import { compareAutoMovieRenderIds } from "./compareAutoMovieRenderIds";
import { AUTOMOVIE_INDEX_BYTES } from "../AUTOMOVIE_INDEX_BYTES";
import { AUTOMOVIE_NORMAL_BYTES } from "../AUTOMOVIE_NORMAL_BYTES";
import { AUTOMOVIE_POSITION_BYTES } from "../AUTOMOVIE_POSITION_BYTES";
import { AUTOMOVIE_SKIN_BYTES } from "../AUTOMOVIE_SKIN_BYTES";
import { AUTOMOVIE_UV_BYTES } from "../AUTOMOVIE_UV_BYTES";

/**
 * Exact geometry cost of one model, memoized by model id.
 *
 * Primitives are measured by tessellating them with the engine's own
 * tessellator rather than by a table of formulas: a table would be a second
 * source of truth for how many triangles a sphere has, and the day the
 * tessellator's ring count changes, the budget would still be checking the old
 * number. Bicubic recipes use the same retained finite engine geometry as
 * display; geometryRealization records their incomplete processing
 * independently of cost.
 */
export function measure(
  model: IAutoMovieModel,
  cache: Map<string, IAutoMovieRenderModelCost>,
  tier?: "hero" | "near" | "far",
): IAutoMovieRenderModelCost {
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
  let recipeComplete: boolean = true,
    hasRecipe: boolean = false;
  const recipeDiagnostics: string[] = [];
  const materials: Set<string> = new Set<string>();
  for (const part of model.parts) {
    if (part.material !== null) materials.add(part.material);
    const realized: IAutoMovieRealizeGeometry.IResult =
      realizeAutoMovieGeometry(part.geometry);
    if (part.geometry.type === "bicubic-atlas") {
      hasRecipe = true;
      recipeComplete &&= realized.complete;
      for (const message of realized.diagnostics)
        recipeDiagnostics.push(`${part.id}: ${message}`);
    }
    const mesh: IAutoMovieMesh = realized.mesh;
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
    ...(hasRecipe
      ? {
          geometryRealization: {
            complete: recipeComplete,
            diagnostics: recipeDiagnostics,
          },
        }
      : {}),
  };
  cache.set(model.id, cost);
  return cost;
}
