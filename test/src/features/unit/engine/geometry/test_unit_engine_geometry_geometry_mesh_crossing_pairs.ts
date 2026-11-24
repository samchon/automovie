import { measureAutoMovieMeshCrossings } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieMeshCrossing,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

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
 */
export function test_unit_engine_geometry_geometry_mesh_crossing_pairs(): void {
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
