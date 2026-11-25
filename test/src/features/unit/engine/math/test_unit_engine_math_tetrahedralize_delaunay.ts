import { tetrahedralizeAutoMovieDelaunay } from "@automovie/engine";
import type {
  IAutoMovieTetrahedralizeDelaunay,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `tetrahedralizeAutoMovieDelaunay` fills the convex hull of the points with
 * tetrahedra on those points only (Bowyer–Watson from an enclosing tetrahedron
 * whose corners are dropped), after joggling each point by at most 30000 ulps
 * of the largest coordinate so no four lie on one sphere.
 *
 * Scenarios:
 *
 * 1. The four corners of the unit right tetrahedron give exactly that one
 *    tetrahedron, volume 1/6, each corner neighbouring the other three.
 * 2. Adding its interior point (1/4, 1/4, 1/4) splits it into four, still filling
 *    1/6.
 * 3. The eight corners of the unit cube fill volume 1 with tetrahedra all of one
 *    orientation and nonzero volume.
 * 4. Every joggled point stays within 30000 ulps of 1 of its input.
 */
export function test_unit_engine_math_tetrahedralize_delaunay(): void {
  const v = (x: number, y: number, z: number): IAutoMovieVector3 => ({
    x,
    y,
    z,
  });
  const volume = (
    mesh: IAutoMovieTetrahedralizeDelaunay.IMesh,
    t: readonly [number, number, number, number],
  ): number => {
    const [a, b, c, d] = t.map(
      (i: number): IAutoMovieVector3 => mesh.points[i]!,
    );
    const u: IAutoMovieVector3 = v(b!.x - a!.x, b!.y - a!.y, b!.z - a!.z);
    const w: IAutoMovieVector3 = v(c!.x - a!.x, c!.y - a!.y, c!.z - a!.z);
    const s: IAutoMovieVector3 = v(d!.x - a!.x, d!.y - a!.y, d!.z - a!.z);
    return (
      (u.x * (w.y * s.z - w.z * s.y) -
        u.y * (w.x * s.z - w.z * s.x) +
        u.z * (w.x * s.y - w.y * s.x)) /
      6
    );
  };
  const filled = (mesh: IAutoMovieTetrahedralizeDelaunay.IMesh): number =>
    mesh.tetrahedra.reduce(
      (sum: number, t: readonly [number, number, number, number]): number =>
        sum + Math.abs(volume(mesh, t)),
      0,
    );

  const corners: IAutoMovieVector3[] = [
    v(0, 0, 0),
    v(1, 0, 0),
    v(0, 1, 0),
    v(0, 0, 1),
  ];
  const one: IAutoMovieTetrahedralizeDelaunay.IMesh =
    tetrahedralizeAutoMovieDelaunay(corners);
  TestValidator.equals(
    "four corners are one tetrahedron, each corner beside the others",
    {
      vertices: one.tetrahedra.map((t: readonly number[]): number[] =>
        [...t].sort((a: number, b: number): number => a - b),
      ),
      neighbours: tetrahedralizeAutoMovieDelaunay.neighbours(one, 4),
      volume: nclose(filled(one), 1 / 6, 1e-9),
    },
    {
      vertices: [[0, 1, 2, 3]],
      neighbours: [
        [1, 2, 3],
        [0, 2, 3],
        [0, 1, 3],
        [0, 1, 2],
      ],
      volume: true,
    },
  );

  const split: IAutoMovieTetrahedralizeDelaunay.IMesh =
    tetrahedralizeAutoMovieDelaunay([...corners, v(0.25, 0.25, 0.25)]);
  TestValidator.predicate(
    "an interior point splits the tetrahedron into four",
    split.tetrahedra.length === 4 && nclose(filled(split), 1 / 6, 1e-9),
  );

  const cube: IAutoMovieVector3[] = [0, 1].flatMap((x: number) =>
    [0, 1].flatMap((y: number) =>
      [0, 1].map((z: number): IAutoMovieVector3 => v(x, y, z)),
    ),
  );
  const filledCube: IAutoMovieTetrahedralizeDelaunay.IMesh =
    tetrahedralizeAutoMovieDelaunay(cube);
  const signs: number[] = filledCube.tetrahedra.map(
    (t: readonly [number, number, number, number]): number =>
      Math.sign(volume(filledCube, t)),
  );
  TestValidator.predicate(
    "the cube is filled once by one orientation",
    nclose(filled(filledCube), 1, 1e-9) &&
      signs.every((sign: number): boolean => sign !== 0 && sign === signs[0]),
  );

  const bound: number = 30000 * Number.EPSILON;
  TestValidator.predicate(
    "the joggle stays within its bound",
    filledCube.points.every(
      (p: IAutoMovieVector3, i: number): boolean =>
        Math.abs(p.x - cube[i]!.x) <= bound &&
        Math.abs(p.y - cube[i]!.y) <= bound &&
        Math.abs(p.z - cube[i]!.z) <= bound,
    ),
  );
}
