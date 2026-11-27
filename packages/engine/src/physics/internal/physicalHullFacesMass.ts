import type {
  IAutoMoviePhysicalHullFaces,
  IAutoMoviePhysicalHullMass,
  IAutoMoviePrincipalTensorFrame,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../../math/Vector3";
import { physicalPrincipalAxes } from "./physicalPrincipalAxes";

/*
 * The volume, centroid and principal inertia of the uniform solid convex hull
 * of a point set.
 *
 * Each face is fanned into triangles and each triangle joined to the hull's
 * mean vertex, so the solid is a sum of tetrahedra. A tetrahedron's volume and
 * centroid are closed forms, and its second moments are exact under the
 * quadrature that weighs each vertex by a twentieth of the volume and the
 * centroid by four fifths. The summed second moments move to the centroid by
 * the parallel-axis theorem and are diagonalized by `physicalPrincipalAxes`.
 * Parameter hull: The hull, built once with its shape, spanning a volume.
 * Returns: The volume in cubic metres, the centroid in the points' frame, and
 * the principal moments per unit mass (square metres, ascending) with the
 * rotation from the principal frame to the points' frame.
 * When the points span no volume.
 */
export function physicalHullFacesMass(
  hull: IAutoMoviePhysicalHullFaces.IHull,
): IAutoMoviePhysicalHullMass.IResult {
  const axes: ("x" | "y" | "z")[] = ["x", "y", "z"];
  let volume: number = 0;
  let moment: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const second: number[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (const face of hull.faces)
    for (let index: number = 1; index + 1 < face.loop.length; index++) {
      const a: IAutoMovieVector3 = Vector3.subtract(face.loop[0]!, hull.centre);
      const b: IAutoMovieVector3 = Vector3.subtract(
        face.loop[index]!,
        hull.centre,
      );
      const c: IAutoMovieVector3 = Vector3.subtract(
        face.loop[index + 1]!,
        hull.centre,
      );
      const v: number = Vector3.dot(a, Vector3.cross(b, c)) / 6;
      const s: IAutoMovieVector3 = Vector3.add(Vector3.add(a, b), c);
      volume += v;
      moment = Vector3.add(moment, Vector3.scale(s, v / 4));
      for (let row: number = 0; row < 3; row++)
        for (let column: number = 0; column < 3; column++)
          second[row]![column]! +=
            (v / 20) *
            (a[axes[row]!] * a[axes[column]!] +
              b[axes[row]!] * b[axes[column]!] +
              c[axes[row]!] * c[axes[column]!] +
              s[axes[row]!] * s[axes[column]!]);
    }
  if (!(volume > 0)) throw new Error("A hull must span a volume");
  const offset: IAutoMovieVector3 = Vector3.scale(moment, 1 / volume);
  // Second moments about the centroid per unit mass, then the inertia tensor
  // as their trace on the diagonal less the moments themselves.
  for (let row: number = 0; row < 3; row++)
    for (let column: number = 0; column < 3; column++)
      second[row]![column] =
        second[row]![column]! / volume -
        offset[axes[row]!] * offset[axes[column]!];
  const trace: number = second[0]![0]! + second[1]![1]! + second[2]![2]!;
  const tensor: number[][] = second.map(
    (line: number[], row: number): number[] =>
      line.map(
        (value: number, column: number): number =>
          (row === column ? trace : 0) - value,
      ),
  );
  const principal: IAutoMoviePrincipalTensorFrame =
    physicalPrincipalAxes(tensor);
  return {
    volume,
    centerOfMass: Vector3.add(hull.centre, offset),
    inertia: principal.moments,
    inertiaRotation: principal.rotation,
  };
}
