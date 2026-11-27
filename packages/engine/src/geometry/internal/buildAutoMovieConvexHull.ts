import type {
  IAutoMovieMesh,
  IAutoMoviePhysicalHullFaces,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMoviePhysicalHullFaces } from "../../physics/AutoMoviePhysicalHullFaces";
import { buildAutoMoviePolyhedron } from "./buildAutoMoviePolyhedron";

/**
 * Build the convex hull of a point set as one closed outward mesh.
 *
 * The hull's faces are the supporting planes `AutoMoviePhysicalHullFaces` finds, each
 * with its loop counter-clockwise seen from outside, and
 * `buildAutoMoviePolyhedron` fans each loop from its first corner with a flat
 * normal and metric UVs. Archetype convex cells and the form expectation
 * check's hull mutant are both this mesh. Points within the hull's coplanarity
 * tolerance of a face lie on it, so a flat ring of many points makes one face.
 * The points are read, and `AutoMoviePhysicalHullFaces` remembers the hull of this very
 * array, so the array must not change after this call.
 *
 * @param points Points in metres, spanning positive volume.
 * @returns The hull as a closed mesh, in the points' frame.
 * @throws {Error} When the points span no volume: fewer than four points, all
 *   of them in one plane, or a coordinate that is not finite, which leaves the
 *   hull search no finite tolerance.
 */
export const buildAutoMovieConvexHull: (
  points: readonly IAutoMovieVector3[],
) => IAutoMovieMesh = (
  points: readonly IAutoMovieVector3[],
): IAutoMovieMesh => {
  const hull: IAutoMoviePhysicalHullFaces.IHull = AutoMoviePhysicalHullFaces.build(points);
  if (hull.faces.length === 0)
    throw new Error("A convex hull needs points spanning positive volume.");
  return buildAutoMoviePolyhedron(
    hull.faces.map(
      (face: IAutoMoviePhysicalHullFaces.IFace): readonly IAutoMovieVector3[] =>
        face.loop,
    ),
  );
};
