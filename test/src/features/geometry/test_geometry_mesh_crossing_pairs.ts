import { type IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { type IAutoMovieMeshCrossing } from "@automovie/engine";
import { measureAutoMovieMeshCrossings } from "@automovie/engine";

/** Two separate blades pierce one hand-typed planar triangle. */
const surface: IAutoMovieMesh = {
  positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
  indices: [0, 1, 2],
  normals: null,
  uvs: null,
  skin: null,
};
const blades: IAutoMovieMesh = {
  positions: [
    0.2, 0.2, -1, 0.2, 0.2, 1, 0.3, 0.2, 1, 0.6, 0.2, -1, 0.6, 0.2, 1, 0.7, 0.2,
    1, 0.5, -0.1, 0, 0.5, 0.1, 0, 0.9, 0.1, 0,
  ],
  indices: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  normals: null,
  uvs: null,
  skin: null,
};

/**
 * The complete-pair option preserves both piercings and a flat overlap on one
 * triangle; the default reports one witness. The clear and empty neighbours
 * bound the mode so it does not turn candidate bounds into intersections.
 *
 * Scenarios:
 * 1. Complete mode names both authored blades and the coplanar overlap.
 * 2. Default and explicit false retain one witness for the subject triangle.
 * 3. Lifted-clear and empty neighbours yield no witnesses in complete mode.
 *
 * @evidence contracts/testing.md#behavioral-verification Executes mesh crossing in complete/default/explicit-false modes and checks ordinal/coplanar records plus clear and empty reports. It catches early exit in complete mode while preserving the default's one-witness-per-subject-triangle behavior.
 * @evidence contracts/testing.md#independent-expectations The two authored vertical blades pierce the reference plane and the third blade overlaps it coplanarly; moving them up clears the plane. Expected triangle ordinals follow supplied index order, independently of candidate traversal. These discrete witnesses do not measure depth or prove an embedded solid.
 * @evidence contracts/testing.md#distinguishing-cases Keeps two transverse piercings and one flat overlap on a single subject triangle, default/false versus complete mode, and lifted/empty neighbours. Edge tolerances, malformed buffers and shared-corner folds belong to the companion crossing tests.
 * @evidence contracts/testing.md#execution-ownership The named entry directly calls portable crossing source with the existing two mesh records, sorting only the returned complete-mode records for comparison. It starts no process, browser, GPU or native build and registers no new cases.
 */
export function test_geometry_mesh_crossing_pairs(): void {
  const all: IAutoMovieMeshCrossing[] = measureAutoMovieMeshCrossings(
    surface,
    blades,
    {
      allPairs: true,
    },
  ).sort(
    (a: IAutoMovieMeshCrossing, b: IAutoMovieMeshCrossing): number =>
      a.other - b.other,
  );
  TestValidator.equals("every piercing and flat overlap", all, [
    { triangle: 0, other: 0, coplanar: false },
    { triangle: 0, other: 1, coplanar: false },
    { triangle: 0, other: 2, coplanar: true },
  ]);
  TestValidator.equals(
    "default remains one witness",
    measureAutoMovieMeshCrossings(surface, blades).length,
    1,
  );
  TestValidator.equals(
    "explicit false remains one witness",
    measureAutoMovieMeshCrossings(surface, blades, { allPairs: false }).length,
    1,
  );
  const clear: IAutoMovieMesh = {
    ...blades,
    positions: blades.positions.map((value: number, index: number): number =>
      index % 3 === 2 ? value + 3 : value,
    ),
  };
  TestValidator.equals(
    "disjoint triangles stay clear in complete mode",
    measureAutoMovieMeshCrossings(surface, clear, { allPairs: true }),
    [],
  );
  TestValidator.equals(
    "an empty first mesh has no pairs",
    measureAutoMovieMeshCrossings(
      { ...surface, positions: [], indices: [] },
      blades,
      { allPairs: true },
    ),
    [],
  );
}
