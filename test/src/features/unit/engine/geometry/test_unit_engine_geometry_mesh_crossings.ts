import { measureAutoMovieMeshCrossings } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieMeshCrossing,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `measureAutoMovieMeshCrossings` lists the triangles of one mesh pierced by
 * the other; the complete-pair option keeps every piercing and flat overlap,
 * the default a single witness.
 *
 * Surface: one triangle (0,0,0), (1,0,0), (0,1,0). Blades: three triangles, two
 * thin blades standing through it at x = 0.2 and 0.6, and one flat in its
 * plane.
 *
 * Scenarios:
 *
 * 1. Complete mode names both blades (not coplanar) and the flat triangle
 *    (coplanar), as `{triangle: 0, other: 0|1|2}`.
 * 2. The default and an explicit `allPairs: false` report one witness.
 * 3. Blades lifted 3 in z are clear: no witness in complete mode; an empty first
 *    mesh has none.
 */
export function test_unit_engine_geometry_mesh_crossings(): void {
  const surface: IAutoMovieMesh = {
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    indices: [0, 1, 2],
    normals: null,
    uvs: null,
    skin: null,
  };
  const blades: IAutoMovieMesh = {
    positions: [
      0.2, 0.2, -1, 0.2, 0.2, 1, 0.3, 0.2, 1, 0.6, 0.2, -1, 0.6, 0.2, 1, 0.7,
      0.2, 1, 0.5, -0.1, 0, 0.5, 0.1, 0, 0.9, 0.1, 0,
    ],
    indices: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    normals: null,
    uvs: null,
    skin: null,
  };
  const all: IAutoMovieMeshCrossing[] = measureAutoMovieMeshCrossings(
    surface,
    blades,
    { allPairs: true },
  ).sort(
    (a: IAutoMovieMeshCrossing, b: IAutoMovieMeshCrossing): number =>
      a.other - b.other,
  );
  TestValidator.equals("complete", all, [
    { triangle: 0, other: 0, coplanar: false },
    { triangle: 0, other: 1, coplanar: false },
    { triangle: 0, other: 2, coplanar: true },
  ]);
  TestValidator.equals(
    "default",
    measureAutoMovieMeshCrossings(surface, blades).length,
    1,
  );
  TestValidator.equals(
    "explicit false",
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
    "clear",
    measureAutoMovieMeshCrossings(surface, clear, { allPairs: true }),
    [],
  );
  TestValidator.equals(
    "empty",
    measureAutoMovieMeshCrossings(
      { ...surface, positions: [], indices: [] },
      blades,
      { allPairs: true },
    ),
    [],
  );
}
