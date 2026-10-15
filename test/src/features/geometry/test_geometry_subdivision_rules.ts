import {
  type IAutoMovieSubdivisionCage,
  type IAutoMovieSubdivisionSurface,
  subdivideAutoMovieSurface,
} from "@automovie/engine";
import { type IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";
import { subdivisionEdgeOrder } from "../internal/subdivisionEdgeOrder";
import { subdivisionFan } from "../internal/subdivisionFan";
import { subdivisionPoint } from "../internal/subdivisionPoint";
import { vclose } from "../internal/vclose";

const CUBE: IAutoMovieSubdivisionCage = {
  positions: [
    -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1, -1, -1, 1, 1, -1, 1, 1, 1, 1,
    -1, 1, 1,
  ],
  faces: [
    [0, 3, 2, 1],
    [4, 5, 6, 7],
    [0, 1, 5, 4],
    [1, 2, 6, 5],
    [2, 3, 7, 6],
    [3, 0, 4, 7],
  ],
};

/** A closed square pyramid: one quad base and four triangles meeting at apex 4. */
const PYRAMID: IAutoMovieSubdivisionCage = {
  positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0, 0.2, -0.1, 1.5],
  faces: [
    [0, 3, 2, 1],
    [0, 1, 4],
    [1, 2, 4],
    [2, 3, 4],
    [3, 0, 4],
  ],
};

const scale: (a: IAutoMovieVector3, s: number) => IAutoMovieVector3 = (
  a: IAutoMovieVector3,
  s: number,
): IAutoMovieVector3 => ({ x: a.x * s, y: a.y * s, z: a.z * s });

const sum: (points: readonly IAutoMovieVector3[]) => IAutoMovieVector3 = (
  points: readonly IAutoMovieVector3[],
): IAutoMovieVector3 =>
  points.reduce(
    (a: IAutoMovieVector3, b: IAutoMovieVector3): IAutoMovieVector3 => ({
      x: a.x + b.x,
      y: a.y + b.y,
      z: a.z + b.z,
    }),
    { x: 0, y: 0, z: 0 },
  );

const centroid: (
  cage: IAutoMovieSubdivisionCage,
  face: readonly number[],
) => IAutoMovieVector3 = (
  cage: IAutoMovieSubdivisionCage,
  face: readonly number[],
): IAutoMovieVector3 =>
  scale(
    sum(
      face.map(
        (v: number): IAutoMovieVector3 => subdivisionPoint(cage.positions, v),
      ),
    ),
    1 / face.length,
  );

/**
 * Catmull and Clark's original vertex rule `(F + 2 R + (n - 3) P) / n`, written
 * from the 1978 definition: `F` the mean of the adjacent face centroids, `R`
 * the mean of the adjacent edge midpoints, `n` the valence.
 */
const catmullClarkVertex: (
  cage: IAutoMovieSubdivisionCage,
  vertex: number,
) => IAutoMovieVector3 = (
  cage: IAutoMovieSubdivisionCage,
  vertex: number,
): IAutoMovieVector3 => {
  const faces: (readonly number[])[] = cage.faces.filter(
    (face: readonly number[]): boolean => face.includes(vertex),
  );
  const neighbours: Set<number> = new Set<number>();
  for (const face of faces) {
    const k: number = face.indexOf(vertex);
    neighbours.add(face[(k + 1) % face.length]!);
    neighbours.add(face[(k + face.length - 1) % face.length]!);
  }
  const n: number = neighbours.size;
  const p: IAutoMovieVector3 = subdivisionPoint(cage.positions, vertex);
  const f: IAutoMovieVector3 = scale(
    sum(
      faces.map(
        (face: readonly number[]): IAutoMovieVector3 => centroid(cage, face),
      ),
    ),
    1 / faces.length,
  );
  const r: IAutoMovieVector3 = scale(
    sum(
      [...neighbours].map(
        (w: number): IAutoMovieVector3 =>
          scale(sum([p, subdivisionPoint(cage.positions, w)]), 0.5),
      ),
    ),
    1 / n,
  );
  return scale(sum([f, scale(r, 2), scale(p, n - 3)]), 1 / n);
};

/** Whether every refined quad of a closed convex surface about the origin faces outward. */
const facesOutward: (surface: IAutoMovieSubdivisionSurface) => boolean = (
  surface: IAutoMovieSubdivisionSurface,
): boolean => {
  for (let f: number = 0; f < surface.faces.length / 4; ++f) {
    const q: IAutoMovieVector3[] = [0, 1, 2, 3].map(
      (k: number): IAutoMovieVector3 =>
        subdivisionPoint(surface.positions, surface.faces[f * 4 + k]!),
    );
    const d1: IAutoMovieVector3 = sum([q[2]!, scale(q[0]!, -1)]);
    const d2: IAutoMovieVector3 = sum([q[3]!, scale(q[1]!, -1)]);
    const normal: IAutoMovieVector3 = {
      x: d1.y * d2.z - d1.z * d2.y,
      y: d1.z * d2.x - d1.x * d2.z,
      z: d1.x * d2.y - d1.y * d2.x,
    };
    const c: IAutoMovieVector3 = scale(sum(q), 0.25);
    if (normal.x * c.x + normal.y * c.y + normal.z * c.z <= 0) return false;
  }
  return true;
};

/**
 * Pins one Catmull-Clark refinement step to the published face, edge and
 * vertex rules, and the documented output order.
 *
 * Scenarios:
 *
 * 1. A cube refines to 26 vertices and 24 quads: cage vertex `i` stays vertex
 *    `i` at the classic valence-3 point `5/9` of its corner, edge points follow
 *    in first-appearance edge order at `3/4` of their edge midpoint, and face
 *    points follow in face order at the face centroid; every child quad keeps
 *    the outward winding.
 * 2. Extraordinary vertices of valence 3, 5 and 6 on non-symmetric fans land on
 *    `(F + 2 R + (n - 3) P) / n` from the 1978 definition.
 * 3. A cage mixing a quad with triangles refines every polygon: the pyramid
 *    gives 18 vertices and 16 quads, triangle face points are centroids, and
 *    the apex, which joins only triangles, follows the same vertex rule.
 * 4. The same cage and level rebuild to identical numbers in identical order.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs `subdivideAutoMovieSurface` at one level and asserts refined positions, counts, vertex numbering and quad winding; a wrong rule weight, wrong numbering, or flipped child quad fails.
 * @evidence contracts/testing.md#independent-expectations Expected points come from Catmull and Clark (1978) as rewritten in the test from cage data, and the cube values 5/9 and 3/4 are the textbook closed forms; the edge order is re-derived by walking the cage, not read from the implementation.
 * @evidence contracts/testing.md#distinguishing-cases Covers a closed all-quad cage, valences 3, 5 and 6, triangles beside a quad, and exact determinism; limit evaluation, boundaries, creases, UVs, parameters and refusals are owned by the other `test_geometry_subdivision_*` tests.
 * @evidence contracts/testing.md#execution-ownership A discoverable unit entry calling the portable engine function on synthetic cages; no consumer, native build, process, browser or GPU.
 */
export function test_geometry_subdivision_rules(): void {
  const cube: IAutoMovieSubdivisionSurface = subdivideAutoMovieSurface({
    cage: CUBE,
    levels: 1,
  });
  const edges: [number, number][] = subdivisionEdgeOrder(CUBE);
  TestValidator.predicate(
    "a cube refines to 26 vertices and 24 quads",
    cube.positions.length === 26 * 3 && cube.faces.length === 24 * 4,
  );
  TestValidator.predicate(
    "cage vertices keep their index at the valence-3 vertex point",
    [0, 1, 2, 3, 4, 5, 6, 7].every((v: number): boolean =>
      vclose(
        subdivisionPoint(cube.positions, v),
        scale(subdivisionPoint(CUBE.positions, v), 5 / 9),
        1e-15,
      ),
    ),
  );
  TestValidator.predicate(
    "edge points follow in first-appearance order at three quarters of the midpoint",
    edges.length === 12 &&
      edges.every(([a, b]: [number, number], e: number): boolean =>
        vclose(
          subdivisionPoint(cube.positions, 8 + e),
          scale(
            sum([
              subdivisionPoint(CUBE.positions, a),
              subdivisionPoint(CUBE.positions, b),
            ]),
            3 / 8,
          ),
          1e-15,
        ),
      ),
  );
  TestValidator.predicate(
    "face points follow in face order at the centroid",
    CUBE.faces.every((face: readonly number[], f: number): boolean =>
      vclose(
        subdivisionPoint(cube.positions, 20 + f),
        centroid(CUBE, face),
        1e-15,
      ),
    ),
  );
  TestValidator.predicate(
    "child quads keep the outward winding",
    facesOutward(cube),
  );

  for (const n of [3, 5, 6]) {
    const fan: IAutoMovieSubdivisionCage = subdivisionFan(
      n,
      0.4,
      (i: number): number => 0.3 * Math.sin(3 * i + 1),
      (i: number): number => 0.2 * Math.cos(2 * i),
    );
    const refined: IAutoMovieSubdivisionSurface = subdivideAutoMovieSurface({
      cage: fan,
      levels: 1,
    });
    TestValidator.predicate(
      `a valence-${n} vertex follows (F + 2R + (n - 3)P) / n`,
      vclose(
        subdivisionPoint(refined.positions, 0),
        catmullClarkVertex(fan, 0),
        1e-14,
      ),
    );
  }

  const pyramid: IAutoMovieSubdivisionSurface = subdivideAutoMovieSurface({
    cage: PYRAMID,
    levels: 1,
  });
  TestValidator.predicate(
    "a quad with four triangles refines to 18 vertices and 16 quads",
    pyramid.positions.length === 18 * 3 && pyramid.faces.length === 16 * 4,
  );
  TestValidator.predicate(
    "triangle face points are centroids",
    PYRAMID.faces.every((face: readonly number[], f: number): boolean =>
      vclose(
        subdivisionPoint(pyramid.positions, 5 + 8 + f),
        centroid(PYRAMID, face),
        1e-15,
      ),
    ),
  );
  TestValidator.predicate(
    "every pyramid vertex, including the all-triangle apex, follows the 1978 rule",
    [0, 1, 2, 3, 4].every((v: number): boolean =>
      vclose(
        subdivisionPoint(pyramid.positions, v),
        catmullClarkVertex(PYRAMID, v),
        1e-14,
      ),
    ),
  );

  TestValidator.predicate(
    "the same cage and level rebuild identically",
    equalGeometryTestValues(
      subdivideAutoMovieSurface({ cage: PYRAMID, levels: 3 }),
      subdivideAutoMovieSurface({ cage: PYRAMID, levels: 3 }),
    ),
  );
}
