import {
  type IAutoMovieSubdivisionCage,
  type IAutoMovieSubdivisionParameter,
  type IAutoMovieSubdivisionSurface,
  subdivideAutoMovieSurface,
} from "@automovie/engine";
import { type IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { subdivisionCornerNormal } from "../internal/subdivisionCornerNormal";
import { subdivisionFan } from "../internal/subdivisionFan";
import { subdivisionGrid } from "../internal/subdivisionGrid";
import { subdivisionPoint } from "../internal/subdivisionPoint";
import { vclose } from "../internal/vclose";

/** Uniform cubic B-spline basis functions and their derivatives. */
const basis: (t: number) => { value: number[]; slope: number[] } = (
  t: number,
): { value: number[]; slope: number[] } => ({
  value: [
    (1 - t) ** 3 / 6,
    (3 * t ** 3 - 6 * t ** 2 + 4) / 6,
    (-3 * t ** 3 + 3 * t ** 2 + 3 * t + 1) / 6,
    t ** 3 / 6,
  ],
  slope: [
    -((1 - t) ** 2) / 2,
    (3 * t ** 2 - 4 * t) / 2,
    (-3 * t ** 2 + 2 * t + 1) / 2,
    t ** 2 / 2,
  ],
});

const cross: (
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
) => IAutoMovieVector3 = (
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
): IAutoMovieVector3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});

const unit: (a: IAutoMovieVector3) => IAutoMovieVector3 = (
  a: IAutoMovieVector3,
): IAutoMovieVector3 => {
  const size: number = Math.hypot(a.x, a.y, a.z);
  return { x: a.x / size, y: a.y / size, z: a.z / size };
};

/**
 * The bicubic B-spline patch of grid face `(i, j)` from its 4 x 4 control
 * points, with its two parameter derivatives, evaluated independently of the
 * subdivider.
 */
const patch: (
  grid: IAutoMovieSubdivisionCage,
  columns: number,
  i: number,
  j: number,
  u: number,
  v: number,
) => {
  point: IAutoMovieVector3;
  du: IAutoMovieVector3;
  dv: IAutoMovieVector3;
} = (
  grid: IAutoMovieSubdivisionCage,
  columns: number,
  i: number,
  j: number,
  u: number,
  v: number,
): {
  point: IAutoMovieVector3;
  du: IAutoMovieVector3;
  dv: IAutoMovieVector3;
} => {
  const bu: { value: number[]; slope: number[] } = basis(u);
  const bv: { value: number[]; slope: number[] } = basis(v);
  const point: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const du: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const dv: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (let b: number = 0; b < 4; ++b)
    for (let a: number = 0; a < 4; ++a) {
      const p: IAutoMovieVector3 = subdivisionPoint(
        grid.positions,
        (j - 1 + b) * (columns + 1) + (i - 1 + a),
      );
      for (const axis of ["x", "y", "z"] as const) {
        point[axis] += bu.value[a]! * bv.value[b]! * p[axis];
        du[axis] += bu.slope[a]! * bv.value[b]! * p[axis];
        dv[axis] += bu.value[a]! * bv.slope[b]! * p[axis];
      }
    }
  return { point, du, dv };
};

/**
 * Halstead, Kass and DeRose's smooth limit `(n^2 P + 4 sum E + sum D) / (n (n + 5))`
 * applied to vertex `vertex`'s quad ring at the surface's own level, read from
 * its faces in any order.
 */
const ringLimit: (
  surface: IAutoMovieSubdivisionSurface,
  vertex: number,
) => IAutoMovieVector3 = (
  surface: IAutoMovieSubdivisionSurface,
  vertex: number,
): IAutoMovieVector3 => {
  let n: number = 0;
  const total: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (let f: number = 0; f < surface.faces.length / 4; ++f) {
    const quad: number[] = surface.faces.slice(f * 4, f * 4 + 4);
    const k: number = quad.indexOf(vertex);
    if (k === -1) continue;
    ++n;
    const edges: IAutoMovieVector3[] = [
      quad[(k + 1) % 4]!,
      quad[(k + 3) % 4]!,
    ].map(
      (w: number): IAutoMovieVector3 => subdivisionPoint(surface.positions, w),
    );
    const diagonal: IAutoMovieVector3 = subdivisionPoint(
      surface.positions,
      quad[(k + 2) % 4]!,
    );
    for (const axis of ["x", "y", "z"] as const)
      total[axis] += 2 * (edges[0]![axis] + edges[1]![axis]) + diagonal[axis];
  }
  const p: IAutoMovieVector3 = subdivisionPoint(surface.positions, vertex);
  return {
    x: (n * n * p.x + total.x) / (n * (n + 5)),
    y: (n * n * p.y + total.y) / (n * (n + 5)),
    z: (n * n * p.z + total.z) / (n * (n + 5)),
  };
};

/**
 * Pins the limit positions, limit normals and cage parameters of smooth
 * regions, regular and extraordinary.
 *
 * Scenarios:
 *
 * 1. On a non-planar 5 x 5 grid, every limit position on a face whose corners
 *    are regular interior vertices equals the bicubic B-spline patch of its 16
 *    control points at the vertex's reported `(u, v)`, and its normal is the
 *    unit `S_u x S_v`, at level 3.
 * 2. Extraordinary vertices of valence 3, 5 and 6: the limit position equals
 *    Halstead, Kass and DeRose's ring formula on the level-1 output, and the
 *    limit position and normal of cage vertex 0 are the same at levels 1 to 4,
 *    which only exact limit and eigenvector tangent masks achieve.
 * 3. A fan symmetric under rotation about Z has its limit on the axis and its
 *    normal exactly +Z, and the refined control point approaches the limit as
 *    the level rises.
 * 4. A closed cube, whose valence-3 corners are smooth, keeps the ring formula
 *    and, by symmetry, has each corner normal along its diagonal.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs `subdivideAutoMovieSurface` and asserts `limitPositions`, the face-varying `normals` and `parameters`; a wrong limit weight, a non-eigenvector tangent mask, a wrong parameter, or a flipped normal fails.
 * @evidence contracts/testing.md#independent-expectations Regular expectations are the uniform bicubic B-spline basis evaluated in the test; extraordinary expectations are the published limit mask applied to the output ring, invariance of the limit point under refinement, and rotational symmetry; tolerances are rounding-level.
 * @evidence contracts/testing.md#distinguishing-cases Covers regular faces, valences 3, 5 and 6 open and closed, symmetric and asymmetric rings, and several levels; refinement rules, boundaries, creases, UVs and refusals are owned by the other `test_geometry_subdivision_*` tests.
 * @evidence contracts/testing.md#execution-ownership A discoverable unit entry calling the portable engine function on synthetic cages; no consumer, native build, process, browser or GPU.
 */
export function test_geometry_subdivision_limit(): void {
  const columns: number = 5;
  const grid: IAutoMovieSubdivisionCage = subdivisionGrid(
    columns,
    5,
    (i: number, j: number): number =>
      0.3 * Math.sin(1.3 * i + 0.7 * j) + 0.04 * i * j,
  );
  const regular: IAutoMovieSubdivisionSurface = subdivideAutoMovieSurface({
    cage: grid,
    levels: 3,
  });
  let checked: number = 0;
  const onPatch: boolean = regular.parameters.every(
    (parameter: IAutoMovieSubdivisionParameter, vertex: number): boolean => {
      const i: number = parameter.face % columns;
      const j: number = Math.floor(parameter.face / columns);
      if (i < 1 || i > 3 || j < 1 || j > 3) return true;
      ++checked;
      const expected: {
        point: IAutoMovieVector3;
        du: IAutoMovieVector3;
        dv: IAutoMovieVector3;
      } = patch(grid, columns, i, j, parameter.u, parameter.v);
      return (
        parameter.corner === null &&
        vclose(
          subdivisionPoint(regular.limitPositions, vertex),
          expected.point,
          1e-12,
        ) &&
        vclose(
          subdivisionCornerNormal(regular, vertex),
          unit(cross(expected.du, expected.dv)),
          1e-12,
        )
      );
    },
  );
  TestValidator.predicate(
    "regular faces evaluate to their bicubic B-spline patch",
    onPatch && checked >= 9 * 64,
  );

  for (const n of [3, 5, 6]) {
    const fan: IAutoMovieSubdivisionCage = subdivisionFan(
      n,
      0.4,
      (i: number): number => 0.3 * Math.sin(3 * i + 1),
      (i: number): number => 0.2 * Math.cos(2 * i),
    );
    const levels: IAutoMovieSubdivisionSurface[] = [1, 2, 3, 4].map(
      (levels: number): IAutoMovieSubdivisionSurface =>
        subdivideAutoMovieSurface({ cage: fan, levels }),
    );
    TestValidator.predicate(
      `a valence-${n} limit matches the published ring formula`,
      vclose(
        subdivisionPoint(levels[0]!.limitPositions, 0),
        ringLimit(levels[0]!, 0),
        1e-14,
      ),
    );
    TestValidator.predicate(
      `a valence-${n} limit position and normal do not depend on the level`,
      levels.every(
        (surface: IAutoMovieSubdivisionSurface): boolean =>
          vclose(
            subdivisionPoint(surface.limitPositions, 0),
            subdivisionPoint(levels[0]!.limitPositions, 0),
            1e-13,
          ) &&
          vclose(
            subdivisionCornerNormal(surface, 0),
            subdivisionCornerNormal(levels[0]!, 0),
            1e-12,
          ),
      ),
    );
  }

  const symmetric: IAutoMovieSubdivisionCage = subdivisionFan(
    5,
    0.6,
    (): number => 0.1,
    (): number => -0.2,
  );
  const coarse: IAutoMovieSubdivisionSurface = subdivideAutoMovieSurface({
    cage: symmetric,
    levels: 1,
  });
  const limit: IAutoMovieVector3 = subdivisionPoint(coarse.limitPositions, 0);
  const distances: number[] = [1, 3, 5].map((levels: number): number => {
    const p: IAutoMovieVector3 = subdivisionPoint(
      subdivideAutoMovieSurface({ cage: symmetric, levels }).positions,
      0,
    );
    return Math.hypot(p.x - limit.x, p.y - limit.y, p.z - limit.z);
  });
  TestValidator.predicate(
    "a rotationally symmetric vertex has its limit on the axis and normal +Z",
    vclose(limit, { x: 0, y: 0, z: limit.z }, 1e-15) &&
      vclose(subdivisionCornerNormal(coarse, 0), { x: 0, y: 0, z: 1 }, 1e-15),
  );
  TestValidator.predicate(
    "refined control points approach the limit",
    distances[0]! > distances[1]! * 4 && distances[1]! > distances[2]! * 4,
  );

  const cube: IAutoMovieSubdivisionSurface = subdivideAutoMovieSurface({
    cage: {
      positions: [
        -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1, -1, -1, 1, 1, -1, 1, 1, 1,
        1, -1, 1, 1,
      ],
      faces: [
        [0, 3, 2, 1],
        [4, 5, 6, 7],
        [0, 1, 5, 4],
        [1, 2, 6, 5],
        [2, 3, 7, 6],
        [3, 0, 4, 7],
      ],
    },
    levels: 1,
  });
  TestValidator.predicate(
    "closed valence-3 corners take the smooth limit, normal along the diagonal",
    [0, 6].every(
      (v: number): boolean =>
        vclose(
          subdivisionPoint(cube.limitPositions, v),
          ringLimit(cube, v),
          1e-14,
        ) &&
        vclose(
          subdivisionCornerNormal(cube, v),
          unit(subdivisionPoint(cube.limitPositions, v)),
          1e-14,
        ),
    ),
  );
}
