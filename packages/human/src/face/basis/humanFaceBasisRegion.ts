import type { IAutoMovieMesh } from "@automovie/interface";

import { createHumanBasisRegion } from "../../common/basis/createHumanBasisRegion";
import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";

/**
 * Emit a material region from an already evaluated connected surface.
 * The basis builder computes the common normals first. UV seams may duplicate a
 * vertex here, but never change that vertex's position, deformation or normal.
 * Inputs are admitted by the basis compiler; this function owns no mutable cache.
 * Metres and normalized/source UV values pass through without coordinate changes.
 */
export function humanFaceBasisRegion(
  positions: number[],
  normals: number[],
  region: IAutoMovieHumanFaceBasis["surfaces"][number]["regions"][number],
): IAutoMovieMesh {
  return createHumanBasisRegion(region)(positions, normals);
}
