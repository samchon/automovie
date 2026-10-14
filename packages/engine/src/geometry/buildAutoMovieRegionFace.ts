import { IAutoMovieMesh } from "@automovie/interface";

import { IAutoMovieProfilePoint } from "./IAutoMovieProfilePoint";
import { IAutoMovieRegionTriangulation } from "./IAutoMovieRegionTriangulation";
import { triangulateAutoMovieRegion } from "./triangulateAutoMovieRegion";

/**
 * Build one open planar region, holes cut out, facing local +Z.
 *
 * This is the single-sided counterpart of `extrudeAutoMovieRegion`: one visible
 * side rather than a zero-thickness solid with coincident front and back
 * faces, so two independently placed copies can carry different materials. A
 * window, for example, keeps a dark exterior pane and a separately lit
 * interior pane without a camera-dependent shader. Rotate a second copy by 180
 * degrees for the opposite side and separate the copies by a real
 * construction offset rather than leaving them coplanar.
 *
 * Positions and texture coordinates are the authored XY metres at Z = 0, and
 * every normal is +Z. The canonical winding makes every triangle face +Z. A
 * malformed ring throws the triangulator's own diagnostic instead of being
 * repaired here. The returned buffers are new.
 *
 * @param props.outer Boundary of the visible region in local XY metres.
 * @param props.holes Voids cut out of the region.
 * @returns A single-sided mesh with metric UVs and no skin.
 *
 * @evidence contracts/common.md#principled-implementation Uses `triangulateAutoMovieRegion`'s counter-clockwise triangles directly, so the right-hand rule makes every face's geometric normal +Z, matching the constant +Z vertex normal.
 * @evidence contracts/common.md#clear-and-simple-design Only lifts the 2D triangulation into the Z = 0 plane and copies XY into UVs; ring admission and triangulation stay with the triangulator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No back face is emitted to fake two-sidedness, and invalid rings are refused by the triangulator rather than patched.
 * @evidence contracts/common.md#meaningful-documentation States how it differs from the extruder and why, how to get the other side, the coordinate, UV and normal conventions, the refusal source, and ownership.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the region's point count after triangulation, whose cost is answered on `triangulateAutoMovieRegion`; one pass over the points appends each position, normal and UV.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call builds the mesh for one authored region; callers that place the same region twice can reuse the returned mesh.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns new position, normal and UV arrays sized by the point count and adopts the triangulation's index array; the triangulation's other arrays are released on return.
 * @author Samchon
 */
export const buildAutoMovieRegionFace = (props: {
  /** Boundary of the visible region in local XY metres. */
  outer: readonly IAutoMovieProfilePoint[];

  /** Optional voids cut out of the visible region. */
  holes?: ReadonlyArray<readonly IAutoMovieProfilePoint[]>;
}): IAutoMovieMesh => {
  const region: IAutoMovieRegionTriangulation =
    triangulateAutoMovieRegion(props);
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
};
