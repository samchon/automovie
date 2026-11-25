import {
  admitSubdivisionCage,
  subdivisionBendingRows,
} from "@automovie/engine";
import type { IAutoMovieSubdivisionLevel } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * `subdivisionBendingRows(level)` gives the frozen-metric bending residual rows
 * M^(-1/2) C of a quad level (cotangent stiffness C over barycentric mass M,
 * each quad split along its 0-2 diagonal), scaled so all squared entries sum to
 * the vertex count.
 *
 * Fixture: the flat 3 x 3 vertex grid of four unit quads.
 *
 * Scenarios:
 *
 * 1. Every row sums to zero (constants carry no bending).
 * 2. The interior vertex 4's row annihilates the linear fields x and y.
 * 3. The squared entries sum to 9.
 * 4. A quad with a repeated position is refused ("degenerate triangle").
 */
export function test_engine_geometry_subdivision_bending_rows(): void {
  const positions: number[] = Array.from(
    { length: 9 },
    (_: unknown, i: number): number[] => [i % 3, Math.floor(i / 3), 0],
  ).flat();
  const faces: number[][] = [
    [0, 1, 4, 3],
    [1, 2, 5, 4],
    [3, 4, 7, 6],
    [4, 5, 8, 7],
  ];
  const level: IAutoMovieSubdivisionLevel = admitSubdivisionCage({
    positions,
    faces,
  });
  const rows: Map<number, number>[] = subdivisionBendingRows(level);
  const apply = (row: Map<number, number>, axis: number): number => {
    let sum: number = 0;
    for (const [j, w] of row) sum += w * positions[3 * j + axis]!;
    return sum;
  };

  // 1.
  TestValidator.predicate(
    "zero sums",
    rows.every(
      (row: Map<number, number>): boolean =>
        Math.abs(
          [...row.values()].reduce((s: number, w: number): number => s + w, 0),
        ) <= 1e-12,
    ),
  );

  // 2.
  TestValidator.predicate(
    "linear",
    Math.abs(apply(rows[4]!, 0)) <= 1e-12 &&
      Math.abs(apply(rows[4]!, 1)) <= 1e-12,
  );

  // 3.
  let squares: number = 0;
  for (const row of rows) for (const w of row.values()) squares += w * w;
  TestValidator.predicate("scale", Math.abs(squares - 9) <= 1e-12);

  // 4.
  const collapsed: number[] = positions.slice();
  collapsed.splice(3, 3, 0, 0, 0);
  TestValidator.predicate(
    "degenerate",
    throwsError(
      (): unknown => subdivisionBendingRows({ ...level, positions: collapsed }),
      "fitting metric contains a degenerate triangle",
    ),
  );
}
