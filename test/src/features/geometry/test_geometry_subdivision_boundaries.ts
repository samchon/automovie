import {
  type IAutoMovieSubdivisionCage,
  type IAutoMovieSubdivisionSurface,
  subdivideAutoMovieSurface,
} from "@automovie/engine";
import { type IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { subdivisionCornerNormal } from "../internal/subdivisionCornerNormal";
import { subdivisionEdgeOrder } from "../internal/subdivisionEdgeOrder";
import { subdivisionGrid } from "../internal/subdivisionGrid";
import { subdivisionPoint } from "../internal/subdivisionPoint";
import { vclose } from "../internal/vclose";

/**
 * A synthetic open cage of `k` quads fanned over a half turn around boundary
 * vertex 0: spokes `1 .. k + 1` on the unit circle at angles `pi i / k`, rim
 * vertices between them at radius 1.7, all lifted by `lift`.
 */
const halfFan: (
  k: number,
  lift: (x: number, y: number) => number,
) => IAutoMovieSubdivisionCage = (
  k: number,
  lift: (x: number, y: number) => number,
): IAutoMovieSubdivisionCage => {
  const positions: number[] = [0, 0, lift(0, 0)];
  const place: (angle: number, radius: number) => void = (
    angle: number,
    radius: number,
  ): void => {
    const x: number = radius * Math.cos(angle);
    const y: number = radius * Math.sin(angle);
    positions.push(x, y, lift(x, y));
  };
  for (let i: number = 0; i <= k; ++i) place((Math.PI * i) / k, 1);
  for (let i: number = 0; i < k; ++i) place((Math.PI * (i + 0.5)) / k, 1.7);
  const faces: number[][] = [];
  for (let i: number = 0; i < k; ++i) faces.push([0, 1 + i, 2 + k + i, 2 + i]);
  return { positions, faces };
};

/** The other ends of the edges at `vertex` that belong to one face only. */
const boundaryNeighbours: (
  faces: readonly number[],
  size: number,
  vertex: number,
) => number[] = (
  faces: readonly number[],
  size: number,
  vertex: number,
): number[] => {
  const uses: Map<number, number> = new Map<number, number>();
  for (let f: number = 0; f < faces.length / size; ++f) {
    const k: number = faces.indexOf(vertex, f * size) - f * size;
    if (k < 0 || k >= size) continue;
    for (const w of [
      faces[f * size + ((k + 1) % size)]!,
      faces[f * size + ((k + size - 1) % size)]!,
    ])
      uses.set(w, (uses.get(w) ?? 0) + 1);
  }
  return [...uses.entries()]
    .filter(([, count]: [number, number]): boolean => count === 1)
    .map(([w]: [number, number]): number => w);
};

const mix: (
  terms: ReadonlyArray<readonly [number, IAutoMovieVector3]>,
) => IAutoMovieVector3 = (
  terms: ReadonlyArray<readonly [number, IAutoMovieVector3]>,
): IAutoMovieVector3 =>
  terms.reduce(
    (a: IAutoMovieVector3, [w, p]: readonly [number, IAutoMovieVector3]): IAutoMovieVector3 => ({
      x: a.x + w * p.x,
      y: a.y + w * p.y,
      z: a.z + w * p.z,
    }),
    { x: 0, y: 0, z: 0 },
  );

/** Whether every limit point lies at Z = 0 and every normal is exactly +Z. */
const flatWithUpNormals: (surface: IAutoMovieSubdivisionSurface) => boolean = (
  surface: IAutoMovieSubdivisionSurface,
): boolean =>
  surface.limitPositions.every(
    (x: number, index: number): boolean => index % 3 !== 2 || x === 0,
  ) &&
  surface.normals.every((x: number, index: number): boolean =>
    nclose(x, index % 3 === 2 ? 1 : 0, 1e-15),
  );

/**
 * Pins the boundary rules: boundary edges are infinitely sharp creases and a
 * boundary corner is rounded (edge-only interpolation).
 *
 * Scenarios:
 *
 * 1. On a jittered, curved 3 x 2 grid, every boundary vertex, including the
 *    valence-2 corners, refines by the crease rule `(6 P + A + B) / 8` over its
 *    two boundary neighbours, and every boundary edge point is the midpoint.
 * 2. Every boundary limit of the level-1 output is the cubic B-spline point
 *    `(A + 4 P + B) / 6` of its boundary neighbours; a grid corner is therefore
 *    not kept, the adjacent case that separates edge-only from corner
 *    interpolation.
 * 3. Flat open cages fanned over two to four faces around a boundary vertex,
 *    and the flat grid with its one-face corners, have every limit point in
 *    the plane and every normal exactly +Z.
 * 4. On curved half fans of two, three, four and six faces, the boundary
 *    vertex's limit position and normal are the same at levels 1 to 4, and the
 *    normal is perpendicular to the exact crease tangent; a one-face cage
 *    corner keeps its normal across levels too.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs `subdivideAutoMovieSurface` on open cages and asserts refined boundary points, limit positions and normals; a smooth rule on the boundary, a kept corner, a non-midpoint boundary edge, or a flipped or tilted boundary normal fails.
 * @evidence contracts/testing.md#independent-expectations The crease rule, midpoint and B-spline limit are the published Hoppe and DeRose boundary rules written in the test from cage or output points; flat cages fix the normal by geometry; curved boundaries use the invariance of the limit under refinement and the exact B-spline crease tangent. The one-face corner is only checked for invariance, because its normal is OpenSubdiv's mask at a degenerate parametrisation, as documented.
 * @evidence contracts/testing.md#distinguishing-cases Covers boundary sides of one, two, three, four and six faces, corners, curved and flat sheets, the exact two-face side and the settled wider sides; interior smooth vertices, creases, UV seams, parameters and refusals are owned by the other `test_geometry_subdivision_*` tests.
 * @evidence contracts/testing.md#execution-ownership A discoverable unit entry calling the portable engine function on synthetic cages; no consumer, native build, process, browser or GPU.
 */
export function test_geometry_subdivision_boundaries(): void {
  const grid: IAutoMovieSubdivisionCage = subdivisionGrid(
    3,
    2,
    (i: number, j: number): number => 0.2 * Math.sin(2 * i + j) + 0.1 * j * j,
  );
  const cage: IAutoMovieSubdivisionCage = {
    ...grid,
    positions: grid.positions.map(
      (x: number, index: number): number =>
        x + (index % 3 === 2 ? 0 : 0.13 * Math.sin(7 * index)),
    ),
  };
  const flatFaces: number[] = cage.faces.flat();
  const vertexCount: number = cage.positions.length / 3;
  const refined: IAutoMovieSubdivisionSurface = subdivideAutoMovieSurface({
    cage,
    levels: 1,
  });
  TestValidator.predicate(
    "boundary vertices take the crease rule over their boundary neighbours",
    Array.from({ length: vertexCount }, (_: unknown, v: number): number => v)
      .filter((v: number): boolean => boundaryNeighbours(flatFaces, 4, v).length === 2)
      .every((v: number): boolean => {
        const [a, b] = boundaryNeighbours(flatFaces, 4, v) as [number, number];
        return vclose(
          subdivisionPoint(refined.positions, v),
          mix([
            [6 / 8, subdivisionPoint(cage.positions, v)],
            [1 / 8, subdivisionPoint(cage.positions, a)],
            [1 / 8, subdivisionPoint(cage.positions, b)],
          ]),
          1e-15,
        );
      }),
  );
  TestValidator.predicate(
    "boundary edge points are midpoints",
    subdivisionEdgeOrder(cage).every(
      ([a, b]: [number, number], e: number): boolean =>
        boundaryNeighbours(flatFaces, 4, a).includes(b) === false ||
        vclose(
          subdivisionPoint(refined.positions, vertexCount + e),
          mix([
            [0.5, subdivisionPoint(cage.positions, a)],
            [0.5, subdivisionPoint(cage.positions, b)],
          ]),
          1e-15,
        ),
    ),
  );
  const boundary: number[] = Array.from(
    { length: refined.positions.length / 3 },
    (_: unknown, v: number): number => v,
  ).filter((v: number): boolean => boundaryNeighbours(refined.faces, 4, v).length === 2);
  TestValidator.predicate(
    "boundary limits are the B-spline points of their boundary neighbours",
    boundary.length === 20 &&
      boundary.every((v: number): boolean => {
        const [a, b] = boundaryNeighbours(refined.faces, 4, v) as [number, number];
        return vclose(
          subdivisionPoint(refined.limitPositions, v),
          mix([
            [1 / 6, subdivisionPoint(refined.positions, a)],
            [4 / 6, subdivisionPoint(refined.positions, v)],
            [1 / 6, subdivisionPoint(refined.positions, b)],
          ]),
          1e-14,
        );
      }),
  );
  TestValidator.predicate(
    "a grid corner is rounded, not kept",
    !vclose(
      subdivisionPoint(refined.limitPositions, 0),
      subdivisionPoint(cage.positions, 0),
      1e-3,
    ),
  );

  for (const k of [2, 3, 4]) {
    const flat: IAutoMovieSubdivisionSurface = subdivideAutoMovieSurface({
      cage: halfFan(k, (): number => 0),
      levels: 2,
    });
    TestValidator.predicate(
      `a flat half fan of ${k} faces stays in the plane with +Z normals`,
      flatWithUpNormals(flat),
    );
  }
  TestValidator.predicate(
    "a flat grid, one-face corners included, stays in the plane with +Z normals",
    flatWithUpNormals(
      subdivideAutoMovieSurface({
        cage: {
          ...cage,
          positions: cage.positions.map((x: number, index: number): number =>
            index % 3 === 2 ? 0 : x,
          ),
        },
        levels: 2,
      }),
    ),
  );

  const lift: (x: number, y: number) => number = (x: number, y: number): number =>
    0.3 * x * x - 0.2 * y + 0.25 * x * y;
  for (const k of [2, 3, 4, 6]) {
    const surfaces: IAutoMovieSubdivisionSurface[] = [1, 2, 3, 4].map(
      (levels: number): IAutoMovieSubdivisionSurface =>
        subdivideAutoMovieSurface({ cage: halfFan(k, lift), levels }),
    );
    const normal: IAutoMovieVector3 = subdivisionCornerNormal(surfaces[0]!, 0);
    const [a, b] = boundaryNeighbours(surfaces[0]!.faces, 4, 0) as [number, number];
    const tangent: IAutoMovieVector3 = mix([
      [1, subdivisionPoint(surfaces[0]!.positions, a)],
      [-1, subdivisionPoint(surfaces[0]!.positions, b)],
    ]);
    TestValidator.predicate(
      `a ${k}-face boundary limit does not depend on the level`,
      surfaces.every(
        (surface: IAutoMovieSubdivisionSurface): boolean =>
          vclose(subdivisionCornerNormal(surface, 0), normal, 1e-13) &&
          vclose(
            subdivisionPoint(surface.limitPositions, 0),
            subdivisionPoint(surfaces[0]!.limitPositions, 0),
            1e-14,
          ),
      ),
    );
    TestValidator.predicate(
      `a ${k}-face boundary normal is perpendicular to the crease tangent`,
      nclose(
        normal.x * tangent.x + normal.y * tangent.y + normal.z * tangent.z,
        0,
        1e-14,
      ),
    );
  }
  const corners: IAutoMovieVector3[] = [1, 2, 3].map(
    (levels: number): IAutoMovieVector3 =>
      subdivisionCornerNormal(subdivideAutoMovieSurface({ cage, levels }), 0),
  );
  TestValidator.predicate(
    "a one-face cage corner keeps its normal across levels",
    corners.every((n: IAutoMovieVector3): boolean => vclose(n, corners[0]!, 1e-13)),
  );
}
