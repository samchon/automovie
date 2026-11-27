import type {
  IAutoMoviePhysicalHullFaces,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";

/*
 * The vertices of a convex hull shrunk inward by a depth: every face plane
 * moves inward by `depth`, and the eroded solid is what remains behind all of
 * them.
 *
 * A vertex of the eroded solid is the meeting point of three moved planes that
 * lies behind every other moved plane, so each triple of faces is solved by
 * Cramer's rule and kept when it does.
 * Parameter hull: The hull, built once with its shape, spanning a volume.
 * Parameter depth: The inward offset, metres; below the hull's `depth` about its
 * centre, so the eroded solid keeps a volume.
 * Returns: The eroded solid's vertices in the points' frame.
 * When the depth leaves no volume.
 */
export function physicalHullFacesErode(
  hull: IAutoMoviePhysicalHullFaces.IHull,
  depth: number,
): IAutoMovieVector3[] {
  if (!(depth < hull.depth))
    throw new Error("A hull's erosion must leave a volume");
  const faces: IAutoMoviePhysicalHullFaces.IFace[] = hull.faces;
  const out: IAutoMovieVector3[] = [];
  for (let i: number = 0; i < faces.length; i++)
    for (let j: number = i + 1; j < faces.length; j++)
      for (let k: number = j + 1; k < faces.length; k++) {
        const a: IAutoMovieVector3 = faces[i]!.normal;
        const b: IAutoMovieVector3 = faces[j]!.normal;
        const c: IAutoMovieVector3 = faces[k]!.normal;
        const bc: IAutoMovieVector3 = AutoMovieEngineVector3.cross(b, c);
        const determinant: number = AutoMovieEngineVector3.dot(a, bc);
        if (Math.abs(determinant) < 1e-12) continue;
        // Cramer's rule for the point on all three moved planes.
        const point: IAutoMovieVector3 = AutoMovieEngineVector3.scale(
          AutoMovieEngineVector3.add(
            AutoMovieEngineVector3.add(
              AutoMovieEngineVector3.scale(bc, faces[i]!.offset - depth),
              AutoMovieEngineVector3.scale(AutoMovieEngineVector3.cross(c, a), faces[j]!.offset - depth),
            ),
            AutoMovieEngineVector3.scale(AutoMovieEngineVector3.cross(a, b), faces[k]!.offset - depth),
          ),
          1 / determinant,
        );
        if (
          faces.every(
            (face: IAutoMoviePhysicalHullFaces.IFace): boolean =>
              AutoMovieEngineVector3.dot(face.normal, point) - (face.offset - depth) <=
              hull.tolerance,
          ) &&
          !out.some(
            (seen: IAutoMovieVector3): boolean =>
              AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(seen, point)) <= hull.tolerance,
          )
        )
          out.push(point);
      }
  return out;
}
