import { AutoMovieEngineGeometry } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieSignedMeshQueryHit,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSignedOctahedron } from "../../internal/createSignedMeshFixture";
import { nclose, throwsError } from "../../internal/predicates";

/**
 * `createSignedMeshQuery(mesh, { boundary: "open" })` reads an
 * oriented sheet's sides, reporting where the nearest feature lies on its rim.
 *
 * Fixture: the upper half of the unit octahedron, four faces on the square rim
 * |x| + |z| = 1 at y = 0.
 *
 * Scenarios:
 *
 * 1. Under the cap (0, 0.5, 0) is negative; above the apex (0, 2, 0) is 1 away at
 *    the vertex; beside a rim edge (0.55, 0.05, 0.55) reads that edge at 0.15 /
 *    sqrt 3 with its single face normal (1, 1, 1) / sqrt 3, on the rim; a rim
 *    vertex (1.2, -0.1, 0) is on the rim, the apex and an interior face point
 *    are not.
 * 2. The closed contract refuses the sheet ("paired oppositely wound"); in open
 *    mode a reversed face or a third face on an edge is still refused ("singly
 *    or oppositely paired").
 * 3. The whole octahedron read as a sheet answers as it does closed, and never
 *    on a rim.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names sheet-side signs, rim versus interior features, closed-contract failure and wrong face incidence.
 * @evidence contracts/development/testing.md#behavioral-verification Measures an open half-octahedron in open and closed modes, checking actual edge and vertex results and trying invalid adjacency.
 * @evidence contracts/development/testing.md#independent-expectations The authored rim lies in y = 0 and the apex is its non-rim extremum. The face plane gives the stated normal and projection distance.
 */
export function test_engine_geometry_signed_mesh_sheet(): void {
  const solid: IAutoMovieMesh = createSignedOctahedron();
  const cap: IAutoMovieMesh = { ...solid, indices: solid.indices!.slice(0, 12) };
  const sheet = AutoMovieEngineGeometry.createSignedMeshQuery(cap, { boundary: "open" });

  // 1.
  TestValidator.predicate("under", sheet([0, 0.5, 0]).signedDistance < 0);
  const above: IAutoMovieSignedMeshQueryHit = sheet([0, 2, 0]);
  TestValidator.predicate("above", nclose(above.signedDistance, 1) && above.feature === "vertex");
  const rim: IAutoMovieSignedMeshQueryHit = sheet([0.55, 0.05, 0.55]);
  TestValidator.predicate(
    "rim edge",
    rim.feature === "edge" &&
      rim.boundary &&
      nclose(rim.signedDistance, 0.15 / Math.sqrt(3)) &&
      rim.normal.every((v: number): boolean => nclose(v, 1 / Math.sqrt(3))),
  );
  TestValidator.equals(
    "rim flags",
    [sheet([1.2, -0.1, 0]).boundary, above.boundary, sheet([0.2, 0.5, 0.2]).boundary],
    [true, false, false],
  );

  // 2.
  TestValidator.predicate(
    "closed contract",
    throwsError((): unknown => AutoMovieEngineGeometry.createSignedMeshQuery(cap), "paired oppositely wound"),
  );
  const reversed: number[] = [...cap.indices!];
  [reversed[0], reversed[1]] = [reversed[1]!, reversed[0]!];
  for (const indices of [reversed, [...cap.indices!, ...cap.indices!.slice(0, 3)]])
    TestValidator.predicate(
      "open still pairs",
      throwsError(
        (): unknown => AutoMovieEngineGeometry.createSignedMeshQuery({ ...cap, indices }, { boundary: "open" }),
        "singly or oppositely paired",
      ),
    );

  // 3.
  const closed = AutoMovieEngineGeometry.createSignedMeshQuery(solid);
  const open = AutoMovieEngineGeometry.createSignedMeshQuery(solid, { boundary: "open" });
  for (const p of [
    [0, 0, 0],
    [2, 0, 0],
    [0.4, 0.4, 0.4],
    [-0.2, 0.9, 0.1],
  ])
    TestValidator.equals(`${p} alike`, open(p), closed(p));
  TestValidator.equals("no rim", [closed([1.2, -0.1, 0]).boundary, open([1.2, -0.1, 0]).boundary], [false, false]);
}
