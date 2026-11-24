import { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieSignedMeshQueryHit,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSignedOctahedron } from "../../../internal/createSignedMeshFixture";
import { equalGeometryTestValues } from "../../../internal/equalGeometryTestValues";
import { nclose, throwsError } from "../../../internal/predicates";

/**
 * An oriented sheet reads its sides within reach of its features.
 * Scenarios:
 * 1. The upper half of an octahedron, four faces on a square rim, admits as a
 *    sheet: a point under the cap is negative, above it positive, and a point
 *    beside a rim edge takes that edge's single face normal and reports the
 *    rim; a rim vertex reports it too, an interior face or the apex does not.
 * 2. The same buffers refuse under the closed contract, and a sheet with an
 *    inconsistently wound or triply incident edge still refuses in open mode.
 * 3. A closed solid queried as a sheet answers exactly as it does closed.
 */
export function test_unit_engine_geometry_geometry_signed_sheet(): void {
  const solid: IAutoMovieMesh = createSignedOctahedron();
  const cap: IAutoMovieMesh = {
    ...solid,
    indices: solid.indices!.slice(0, 12),
  };
  const sheet: (point: readonly number[]) => IAutoMovieSignedMeshQueryHit =
    createAutoMovieSignedMeshQuery(cap, { boundary: "open" });
  TestValidator.predicate(
    "under the cap is the negative side",
    sheet([0, 0.5, 0]).signedDistance < 0,
  );
  const above: IAutoMovieSignedMeshQueryHit = sheet([0, 2, 0]);
  TestValidator.predicate(
    "above the apex is exterior",
    nclose(above.signedDistance, 1) && above.feature === "vertex",
  );
  const rim: IAutoMovieSignedMeshQueryHit = sheet([0.55, 0.05, 0.55]);
  TestValidator.predicate(
    "rim edge carries its single face normal and reports the rim",
    rim.feature === "edge" &&
      rim.boundary &&
      nclose(rim.signedDistance, 0.15 / Math.sqrt(3)) &&
      rim.normal.length === 3 &&
      rim.normal.every((value: number): boolean =>
        nclose(value, 1 / Math.sqrt(3)),
      ),
  );
  TestValidator.predicate(
    "rim vertex reports the rim, apex and face do not",
    sheet([1.2, -0.1, 0]).boundary &&
      !above.boundary &&
      !sheet([0.2, 0.5, 0.2]).boundary,
  );
  TestValidator.predicate(
    "closed contract refuses the sheet",
    throwsError(
      (): ((point: readonly number[]) => IAutoMovieSignedMeshQueryHit) =>
        createAutoMovieSignedMeshQuery(cap),
      "paired oppositely wound",
    ),
  );
  const inconsistent: IAutoMovieMesh = structuredClone(cap);
  [inconsistent.indices![0], inconsistent.indices![1]] = [
    inconsistent.indices![1],
    inconsistent.indices![0],
  ];
  const triple: IAutoMovieMesh = {
    ...cap,
    indices: [...cap.indices!, ...cap.indices!.slice(0, 3)],
  };
  for (const mesh of [inconsistent, triple])
    TestValidator.predicate(
      "sheet mode still refuses unpaired winding",
      throwsError(
        (): ((point: readonly number[]) => IAutoMovieSignedMeshQueryHit) =>
          createAutoMovieSignedMeshQuery(mesh, { boundary: "open" }),
        "singly or oppositely paired",
      ),
    );
  const closed: (point: readonly number[]) => IAutoMovieSignedMeshQueryHit =
    createAutoMovieSignedMeshQuery(solid);
  const asSheet: (point: readonly number[]) => IAutoMovieSignedMeshQueryHit =
    createAutoMovieSignedMeshQuery(solid, { boundary: "open" });
  for (const point of [
    [0, 0, 0],
    [2, 0, 0],
    [0.4, 0.4, 0.4],
    [-0.2, 0.9, 0.1],
  ])
    TestValidator.predicate(
      "closed solid reads alike",
      equalGeometryTestValues(asSheet(point), closed(point)),
    );
  TestValidator.predicate(
    "a closed solid never reports a rim",
    !closed([1.2, -0.1, 0]).boundary && !asSheet([1.2, -0.1, 0]).boundary,
  );
}
