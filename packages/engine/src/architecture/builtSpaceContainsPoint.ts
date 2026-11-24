import {
  IAutoMovieBuiltSpace,
  IAutoMovieConvexSpaceCell,
  IAutoMovieHalfSpacePlane,
  IAutoMovieMeshWinding,
  IAutoMovieSpaceShell,
  IAutoMovieVector3,
} from "@automovie/interface";

import { createAutoMovieMeshWindingQuery } from "../geometry/createAutoMovieMeshWindingQuery";

/** Slack, in the plane's own scale, within which a point counts as on it. */
const CONTAINMENT_EPSILON: number = 1e-9;

/**
 * Does one logical space's own stated volume contain a point?
 *
 * A celled space is the union of its half-space cells, a shelled space uses its
 * closed boundary, and a space with neither spelling contains nothing.
 * Descendant containment, room visibility, prop occupancy and basin containment
 * share this per-space reader.
 *
 * Boundary points are intended inside. Cell slack is 1e-9 in the plane's scale,
 * measured in metres only for unit normals. A shell is read by
 * `createAutoMovieMeshWindingQuery`: a point on a shell triangle within its
 * area-scaled slack is inside, and otherwise the winding number distinguishes
 * the outer region from inward-wound voids. A point with a coordinate that is
 * not finite lies in no shell. Raw binary64 products and sums can overflow or
 * lose accuracy for extreme or nearly degenerate inputs; the returned Boolean
 * is not an exact containment certificate.
 *
 * @param space Logical space whose stated volume is tested.
 * @param point World point, in metres.
 * @returns True when the point lies inside or on the stated volume.
 */
export const builtSpaceContainsPoint: (
  space: IAutoMovieBuiltSpace,
  point: IAutoMovieVector3,
) => boolean = (
  space: IAutoMovieBuiltSpace,
  point: IAutoMovieVector3,
): boolean => {
  if (space.shell !== undefined)
    return spaceShellContainsPoint(space.shell, point);
  return space.cells.some((cell: IAutoMovieConvexSpaceCell): boolean =>
    cell.planes.every(
      (plane: IAutoMovieHalfSpacePlane): boolean =>
        plane.normal.x * point.x +
          plane.normal.y * point.y +
          plane.normal.z * point.z <=
        plane.offset + CONTAINMENT_EPSILON,
    ),
  );
};

/**
 * Is a point inside or on a closed shell?
 *
 * The shell is not validated here, so its triples are admitted as the
 * arithmetic can read them: a triple naming a missing or non-finite vertex and
 * a trailing incomplete triple are dropped before the winding query, which
 * would refuse them, and a shell with no triangle left contains nothing. A
 * point with a coordinate that is not finite lies in no shell, as the
 * solid-angle sum this query replaced read it, rather than reaching the query,
 * which refuses it. For a closed consistently wound shell, inward void walls
 * cancel the outer winding in the void, so the void reads empty.
 */
const spaceShellContainsPoint: (
  shell: IAutoMovieSpaceShell,
  point: IAutoMovieVector3,
) => boolean = (
  shell: IAutoMovieSpaceShell,
  point: IAutoMovieVector3,
): boolean => {
  if (
    !Number.isFinite(point.x) ||
    !Number.isFinite(point.y) ||
    !Number.isFinite(point.z)
  )
    return false;
  const positions: number[] = [];
  for (let face: number = 0; face + 2 < shell.triangles.length; face += 3) {
    const corners: IAutoMovieVector3[] = [];
    for (let corner: number = 0; corner < 3; ++corner) {
      const vertex: IAutoMovieVector3 | undefined =
        shell.vertices[shell.triangles[face + corner]!];
      if (
        vertex === undefined ||
        !Number.isFinite(vertex.x) ||
        !Number.isFinite(vertex.y) ||
        !Number.isFinite(vertex.z)
      )
        break;
      corners.push(vertex);
    }
    if (corners.length < 3) continue;
    for (const corner of corners) positions.push(corner.x, corner.y, corner.z);
  }
  if (positions.length === 0) return false;
  const answer: IAutoMovieMeshWinding = createAutoMovieMeshWindingQuery({
    positions,
    normals: null,
    uvs: null,
    indices: null,
    skin: null,
  })([point.x, point.y, point.z]);
  return answer.surface || answer.inside;
};
