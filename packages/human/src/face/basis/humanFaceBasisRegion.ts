import type { IAutoMovieMesh } from "@automovie/interface";

import { createHumanBasisRegion } from "../../common/basis/createHumanBasisRegion";
import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";

/**
 * Emit a material region from an already evaluated connected surface.
 * The basis builder computes the common normals first. UV seams may duplicate a
 * vertex here, but never change that vertex's position, deformation or normal.
 * Inputs are admitted by the basis compiler; this function owns no mutable cache.
 * Metres and normalized/source UV values pass through without coordinate changes.
 *
 * @evidence contracts/common.md#principled-implementation Emitting a region from evaluated positions and common normals through the shared region builder makes UV seams duplicate vertices without changing a position or normal, because the deformation was already evaluated per resident vertex.
 * @evidence contracts/common.md#clear-and-simple-design A one-line delegation to the shared owner createHumanBasisRegion, kept as the face's named entry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special case or compensating path.
 * @evidence contracts/common.md#meaningful-documentation States units, that UV seams do not alter geometry, and that inputs are admitted upstream.
 * @evidence contracts/modeling.md#spatial-conventions Basis metres pass through unchanged.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A material region is a triangle partition of one connected surface, not an anatomical part; anatomical parts are owned by the component tree.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines and consumes no channel.
 * @evidence contracts/modeling.md#emitted-geometry Emits exactly the region's triangles; the count is the partition the basis declares.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Regions partition one connected surface, so shared vertices are the same resident vertices; no boundary is constructed.
 * @evidenceExclude contracts/modeling.md#rendered-observation A region function is observed through the assembled skin part; this function owns no displayed part.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no caller input.
 */
export function humanFaceBasisRegion(
  positions: number[],
  normals: number[],
  region: IAutoMovieHumanFaceBasis["surfaces"][number]["regions"][number],
): IAutoMovieMesh {
  return createHumanBasisRegion(region)(positions, normals);
}
