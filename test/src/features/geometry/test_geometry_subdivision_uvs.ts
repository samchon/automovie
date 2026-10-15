import {
  type IAutoMovieSubdivisionCage,
  type IAutoMovieSubdivisionParameter,
  type IAutoMovieSubdivisionSurface,
  subdivideAutoMovieSurface,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { subdivisionGrid } from "../internal/subdivisionGrid";

/**
 * A 4 x 2 grid cut into two UV charts along the column x = 2: the left chart
 * maps grid point `(x, y)` to `(0.1 x, 0.1 y)` and the right chart to
 * `(0.5 + 0.1 x, 0.1 y)`, so the seam vertices carry two UVs each.
 */
const charted: () => IAutoMovieSubdivisionCage =
  (): IAutoMovieSubdivisionCage => {
    const grid: IAutoMovieSubdivisionCage = subdivisionGrid(
      4,
      2,
      (i: number, j: number): number => 0.25 * Math.sin(i + 2 * j),
    );
    const uvs: number[] = [];
    const index: Map<string, number> = new Map<string, number>();
    const uvOf: (x: number, y: number, right: boolean) => number = (
      x: number,
      y: number,
      right: boolean,
    ): number => {
      const key: string = `${x},${y},${right}`;
      if (!index.has(key)) {
        index.set(key, uvs.length / 2);
        uvs.push((right ? 0.5 : 0) + 0.1 * x, 0.1 * y);
      }
      return index.get(key)!;
    };
    const uvFaces: number[][] = grid.faces.map(
      (face: readonly number[], f: number): number[] =>
        face.map((v: number): number =>
          uvOf(v % 5, Math.floor(v / 5), f % 4 >= 2),
        ),
    );
    return { ...grid, uvs, uvFaces };
  };

/** Grid coordinates of a vertex of a refined grid, from its cage parameters. */
const gridPoint: (
  parameter: IAutoMovieSubdivisionParameter,
  columns: number,
) => [number, number] = (
  parameter: IAutoMovieSubdivisionParameter,
  columns: number,
): [number, number] => [
  (parameter.face % columns) + parameter.u,
  Math.floor(parameter.face / columns) + parameter.v,
];

/**
 * Pins face-varying UV refinement with pinned chart boundaries, and the cage
 * parameters reported per vertex.
 *
 * Scenarios:
 *
 * 1. Two charts that are each a linear map of the grid keep it exactly at
 *    level 3: every face corner's UV is its chart's map of the corner's grid
 *    point, including the outer corners, where the positions are rounded, and
 *    the seam keeps two UV values per vertex.
 * 2. A seam UV moved off its chart's line keeps its value exactly at every
 *    level, its seam edges take midpoints, while an interior UV moved off the
 *    line is smoothed by the vertex rule `(n - 2) / n` plus `1 / n^2` per
 *    neighbour and face point.
 * 3. A cage without UVs returns `null` for both UV arrays.
 * 4. Parameters: a quad grid reports every vertex on the lowest-numbered face
 *    containing it, with dyadic `(u, v)`; a triangle splits into corner
 *    sub-faces, its corners at `(0, 0)` of their own, its first two edge
 *    points at `(1, 0)` of the corner before them, its closing edge point at
 *    `(0, 1)` of corner 0, which reaches it first, and its centre at `(1, 1)`
 *    of corner 0.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs `subdivideAutoMovieSurface` with face-varying UVs and asserts `uvs`, `uvFaces` and `parameters`; smoothing a seam, merging the two sides of a seam, a wrong interior rule, a wrong parameter face or coordinate fails.
 * @evidence contracts/testing.md#independent-expectations Linear charts are reproduced exactly by Catmull-Clark on a regular grid and kept by pinned boundaries, so the expected UV is the chart map of the grid point; the interior rule is Catmull and Clark's written in the test; parameter expectations follow the documented square and sub-face conventions.
 * @evidence contracts/testing.md#distinguishing-cases Covers linear and non-linear charts, seam versus interior values, outer boundary corners, an absent UV set, quad and triangle parameters, and shared vertices; positions, limits, creases and refusals are owned by the other `test_geometry_subdivision_*` tests.
 * @evidence contracts/testing.md#execution-ownership A discoverable unit entry calling the portable engine function on synthetic cages; no consumer, native build, process, browser or GPU.
 */
export function test_geometry_subdivision_uvs(): void {
  const cage: IAutoMovieSubdivisionCage = charted();
  const refined: IAutoMovieSubdivisionSurface = subdivideAutoMovieSurface({
    cage,
    levels: 3,
  });
  TestValidator.predicate(
    "linear charts survive subdivision exactly on both sides of the seam",
    refined.faces.every((v: number, c: number): boolean => {
      const f: number = Math.floor(c / 4);
      const centreX: number =
        [0, 1, 2, 3].reduce(
          (sum: number, k: number): number =>
            sum +
            gridPoint(refined.parameters[refined.faces[f * 4 + k]!]!, 4)[0],
          0,
        ) / 4;
      const [x, y] = gridPoint(refined.parameters[v]!, 4);
      const uv: number = refined.uvFaces![c]!;
      return (
        nclose(
          refined.uvs![uv * 2]!,
          (centreX > 2 ? 0.5 : 0) + 0.1 * x,
          1e-15,
        ) && nclose(refined.uvs![uv * 2 + 1]!, 0.1 * y, 1e-15)
      );
    }),
  );
  const seamValues: Set<number> = new Set<number>();
  refined.faces.forEach((v: number, c: number): void => {
    if (v === 2) seamValues.add(refined.uvFaces![c]!);
  });
  TestValidator.predicate(
    "a seam vertex keeps two UV values",
    seamValues.size === 2,
  );

  const bent: IAutoMovieSubdivisionCage = charted();
  const seamUv: number = bent.uvFaces![1]![1]!;
  const interiorUv: number = bent.uvFaces![0]![2]!;
  const uvs: number[] = bent.uvs!.slice();
  uvs[seamUv * 2 + 1] = 0.37;
  uvs[interiorUv * 2] = 0.19;
  const moved: IAutoMovieSubdivisionCage = { ...bent, uvs };
  const once: IAutoMovieSubdivisionSurface = subdivideAutoMovieSurface({
    cage: moved,
    levels: 1,
  });
  const thrice: IAutoMovieSubdivisionSurface = subdivideAutoMovieSurface({
    cage: moved,
    levels: 3,
  });
  const interior: number[] = [0, 1].map((axis: number): number => {
    const face: (corners: readonly number[]) => number = (
      corners: readonly number[],
    ): number =>
      corners.reduce(
        (sum: number, t: number): number => sum + uvs[t * 2 + axis]! / 4,
        0,
      );
    const faces: number = [0, 1, 4, 5]
      .map((f: number): number => face(moved.uvFaces![f]!))
      .reduce((a: number, b: number): number => a + b, 0);
    const edges: number = [1, 5, 7, 11]
      .map((v: number): number => {
        const corner: number = moved.faces.flat().indexOf(v);
        return uvs[moved.uvFaces!.flat()[corner]! * 2 + axis]!;
      })
      .reduce((a: number, b: number): number => a + b, 0);
    return (2 / 4) * uvs[interiorUv * 2 + axis]! + edges / 16 + faces / 16;
  });
  TestValidator.predicate(
    "a seam UV is pinned at every level and an interior UV is smoothed",
    [once, thrice].every(
      (s: IAutoMovieSubdivisionSurface): boolean =>
        s.uvs![seamUv * 2] === uvs[seamUv * 2] &&
        s.uvs![seamUv * 2 + 1] === 0.37,
    ) &&
      nclose(once.uvs![interiorUv * 2]!, interior[0]!, 1e-15) &&
      nclose(once.uvs![interiorUv * 2 + 1]!, interior[1]!, 1e-15) &&
      !nclose(once.uvs![interiorUv * 2]!, 0.19, 1e-6),
  );
  TestValidator.predicate(
    "a cage without UVs refines without them",
    ((s: IAutoMovieSubdivisionSurface): boolean =>
      s.uvs === null && s.uvFaces === null)(
      subdivideAutoMovieSurface({
        cage: { positions: cage.positions, faces: cage.faces },
        levels: 1,
      }),
    ),
  );

  const grid: IAutoMovieSubdivisionSurface = subdivideAutoMovieSurface({
    cage: subdivisionGrid(2, 2, (): number => 0),
    levels: 2,
  });
  TestValidator.predicate(
    "quad parameters name the lowest face and dyadic coordinates",
    grid.parameters.every((p: IAutoMovieSubdivisionParameter): boolean => {
      const [x, y] = gridPoint(p, 2);
      return (
        p.corner === null &&
        Number.isInteger(p.u * 4) &&
        Number.isInteger(p.v * 4) &&
        p.face ===
          Math.max(0, Math.ceil(y) - 1) * 2 + Math.max(0, Math.ceil(x) - 1)
      );
    }) &&
      Array.from(
        { length: grid.faces.length / 4 },
        (_: unknown, f: number): boolean => {
          const points: [number, number][] = [0, 1, 2, 3].map(
            (k: number): [number, number] =>
              gridPoint(grid.parameters[grid.faces[f * 4 + k]!]!, 2),
          );
          const xs: number[] = points.map(
            (q: [number, number]): number => q[0],
          );
          const ys: number[] = points.map(
            (q: [number, number]): number => q[1],
          );
          return (
            Math.max(...xs) - Math.min(...xs) === 0.25 &&
            Math.max(...ys) - Math.min(...ys) === 0.25
          );
        },
      ).every((fits: boolean): boolean => fits),
  );
  const triangle: IAutoMovieSubdivisionSurface = subdivideAutoMovieSurface({
    cage: { positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], faces: [[0, 1, 2]] },
    levels: 1,
  });
  TestValidator.predicate(
    "a triangle splits into corner sub-faces",
    triangle.parameters.length === 7 &&
      [0, 1, 2].every(
        (k: number): boolean =>
          triangle.parameters[k]!.corner === k &&
          triangle.parameters[k]!.u === 0 &&
          triangle.parameters[k]!.v === 0,
      ) &&
      [
        [0, 1, 0],
        [1, 1, 0],
        [0, 0, 1],
      ].every(
        ([corner, u, v]: number[], e: number): boolean =>
          triangle.parameters[3 + e]!.corner === corner &&
          triangle.parameters[3 + e]!.u === u &&
          triangle.parameters[3 + e]!.v === v,
      ) &&
      triangle.parameters[6]!.corner === 0 &&
      triangle.parameters[6]!.u === 1 &&
      triangle.parameters[6]!.v === 1,
  );
}
