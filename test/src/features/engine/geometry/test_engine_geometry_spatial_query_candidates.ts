import {
  buildAutoMovieMeshQueryHierarchy,
  collectAutoMovieSpatialQueryCandidates,
} from "@automovie/engine";
import type { IAutoMovieSpatialQueryEntry } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * `collectAutoMovieSpatialQueryCandidates(tree, subject, cell, population)`
 * returns the entries whose boxes overlap the subject's ("overlap", boundaries
 * included) or share a grid cell of width `cell` with it ("shared-cell"),
 * sorted by their first shared cell in x, y, z, then by ordinal.
 *
 * Fixture: unit cubes along x with lows 0 (ordinal 3), 1.5 (ordinal 0), 2.2
 * (ordinal 1) and 5 (ordinal 2); the subject [1, 2] x [0, 1] x [0, 1]; cell 1.
 *
 * Scenarios:
 *
 * 1. Overlap: the cubes at 1.5 and at 0 (touching at x = 1) qualify; both first
 *    share cell 1, so ordinal orders them: [0, 3], by reference.
 * 2. Shared cell: the cube at 2.2 also shares cell 2 and sorts after them by its
 *    first shared cell: [0, 3, 1].
 * 3. An infinite cell puts every coordinate in cell 0: all four, by ordinal.
 * 4. Cell widths 0, -1 and NaN are refused ("positive cell width").
 */
export function test_engine_geometry_spatial_query_candidates(): void {
  const cube = (ordinal: number, x: number): IAutoMovieSpatialQueryEntry => ({
    ordinal,
    low: [x, 0, 0],
    high: [x + 1, 1, 1],
    centre: [x + 0.5, 0.5, 0.5],
  });
  const entries: IAutoMovieSpatialQueryEntry[] = [
    cube(3, 0),
    cube(0, 1.5),
    cube(1, 2.2),
    cube(2, 5),
  ];
  const tree = buildAutoMovieMeshQueryHierarchy([...entries]);
  const subject: IAutoMovieSpatialQueryEntry = cube(-1, 1);
  const ordinals = (
    population: "overlap" | "shared-cell",
    cell: number,
  ): number[] =>
    collectAutoMovieSpatialQueryCandidates(tree, subject, cell, population).map(
      (e: IAutoMovieSpatialQueryEntry): number => e.ordinal,
    );

  // 1.
  TestValidator.equals("overlap", ordinals("overlap", 1), [0, 3]);
  TestValidator.predicate(
    "by reference",
    collectAutoMovieSpatialQueryCandidates(tree, subject, 1, "overlap")[0] ===
      entries[1],
  );

  // 2.
  TestValidator.equals("shared cell", ordinals("shared-cell", 1), [0, 3, 1]);

  // 3.
  TestValidator.equals(
    "infinite cell",
    ordinals("shared-cell", Infinity),
    [0, 1, 2, 3],
  );

  // 4.
  for (const cell of [0, -1, NaN])
    TestValidator.predicate(
      `cell ${cell}`,
      throwsError(
        (): unknown =>
          collectAutoMovieSpatialQueryCandidates(
            tree,
            subject,
            cell,
            "overlap",
          ),
        "positive cell width",
      ),
    );
}
