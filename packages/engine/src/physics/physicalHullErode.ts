import type { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { physicalHullFaces } from "./physicalHullFaces";

/**
 * The vertices of a convex hull shrunk inward by a depth: every face plane
 * moves inward by `depth`, and the eroded solid is what remains behind all
 * of them.
 *
 * A vertex of the eroded solid is the meeting point of three moved planes
 * that lies behind every other moved plane, so each triple of faces is
 * solved by Cramer's rule and kept when it does.
 *
 * @param points The hull's shape-local points, metres, spanning a volume.
 * @param depth The inward offset, metres; below the hull's `depth` about its
 *   centre, so the eroded solid keeps a volume.
 * @returns The eroded solid's vertices in the points' frame.
 * @throws {Error} When the depth leaves no volume.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the erosion as moved half-spaces, how vertices are found, the premise on the depth and the frame.
 * @evidence contracts/development/implementation.md#principled-implementation Erosion of a convex polytope by a ball is the intersection of its half-spaces moved inward by the radius; vertex enumeration of that intersection takes each plane triple's unique point and keeps the feasible ones.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns only the erosion: faces come from `physicalHullFaces`, and the result is a point set any hull consumer reads, so a compliant shape's rigid core is one more hull.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Parallel triples are refused by a determinant below 1e-12, dimensionless because the normals are units; feasibility uses the hull's own coplanarity tolerance. The non-null assertions index the face list by bounded indices.
 * @evidence contracts/development/implementation.md#efficient-algorithms Quartic in the face count, a few dozen faces, once per compliant hull when a world is bound.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per compliant hull collider at binding; nothing repeats it.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps nothing between calls; its temporaries die with the call.
 */
export function physicalHullErode(
  points: readonly IAutoMovieVector3[],
  depth: number,
): IAutoMovieVector3[] {
  const hull: physicalHullFaces.IHull = physicalHullFaces(points);
  if (!(depth < hull.depth))
    throw new Error("A hull's erosion must leave a volume");
  const faces: physicalHullFaces.IFace[] = hull.faces;
  const out: IAutoMovieVector3[] = [];
  for (let i: number = 0; i < faces.length; i++)
    for (let j: number = i + 1; j < faces.length; j++)
      for (let k: number = j + 1; k < faces.length; k++) {
        const a: IAutoMovieVector3 = faces[i]!.normal;
        const b: IAutoMovieVector3 = faces[j]!.normal;
        const c: IAutoMovieVector3 = faces[k]!.normal;
        const bc: IAutoMovieVector3 = Vector3.cross(b, c);
        const determinant: number = Vector3.dot(a, bc);
        if (Math.abs(determinant) < 1e-12) continue;
        // Cramer's rule for the point on all three moved planes.
        const point: IAutoMovieVector3 = Vector3.scale(
          Vector3.add(
            Vector3.add(
              Vector3.scale(bc, faces[i]!.offset - depth),
              Vector3.scale(Vector3.cross(c, a), faces[j]!.offset - depth),
            ),
            Vector3.scale(Vector3.cross(a, b), faces[k]!.offset - depth),
          ),
          1 / determinant,
        );
        if (
          faces.every(
            (face: physicalHullFaces.IFace): boolean =>
              Vector3.dot(face.normal, point) - (face.offset - depth) <=
              hull.tolerance,
          ) &&
          !out.some(
            (seen: IAutoMovieVector3): boolean =>
              Vector3.length(Vector3.subtract(seen, point)) <= hull.tolerance,
          )
        )
          out.push(point);
      }
  return out;
}
