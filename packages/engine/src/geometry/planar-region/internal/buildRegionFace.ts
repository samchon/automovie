import {
  IAutoMovieMesh,
  type IAutoMoviePlanarRegion,
  type IAutoMovieRegionTriangulation,
} from "@automovie/interface";

import { triangulateRegion } from "./triangulateRegion";

/**
 * Build one open planar region, holes cut out, facing local +Z.
 *
 * This is the single-sided counterpart of
 * `AutoMovieEnginePlanarRegion.extrude`: one visible side rather than a
 * zero-thickness solid with coincident front and back faces, so two
 * independently placed copies can carry different materials. A window, for
 * example, keeps a dark exterior pane and a separately lit interior pane
 * without a camera-dependent shader. Rotate a second copy by 180 degrees for
 * the opposite side and separate the copies by a real construction offset
 * rather than leaving them coplanar.
 *
 * Positions and texture coordinates are the authored XY metres at Z = 0, and
 * every normal is +Z. The canonical winding makes every triangle face +Z. A
 * malformed ring throws the triangulator's own diagnostic instead of being
 * repaired here. The returned buffers are new.
 *
 * @param props.outer Boundary of the visible region in local XY metres.
 * @param props.holes Voids cut out of the region.
 * @returns A single-sided mesh with metric UVs and no skin.
 */
export function buildRegionFace(props: IAutoMoviePlanarRegion): IAutoMovieMesh {
  const region: IAutoMovieRegionTriangulation = triangulateRegion(
    props.outer,
    props.holes ?? [],
    "polygon",
  );
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  for (const point of region.points) {
    positions.push(point.x, point.y, 0);
    normals.push(0, 0, 1);
    uvs.push(point.x, point.y);
  }
  return {
    positions,
    normals,
    uvs,
    indices: region.triangles,
    skin: null,
  };
}
