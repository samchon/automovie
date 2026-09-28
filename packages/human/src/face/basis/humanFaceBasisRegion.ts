import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import { createHumanFaceBasisRegion } from "./createHumanFaceBasisRegion";

/**
 * Emit a material region from an already evaluated connected surface.
 * The basis builder computes the common normals first. UV seams may duplicate a
 * vertex here, but never change that vertex's position, deformation or normal.
 * Inputs are admitted by the basis compiler; this function owns no mutable cache.
 * Metres and normalized/source UV values pass through without coordinate changes.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Preserves connected deformation and normal continuity across material boundaries.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-basis Splits only UV identities after copying each source vertex's common evaluated normal.
 */
export function humanFaceBasisRegion(
  positions: number[],
  normals: number[],
  region: IAutoMovieHumanFaceBasis["surfaces"][number]["regions"][number],
): IAutoMovieMesh {
  return createHumanFaceBasisRegion(region)(positions, normals);
}
