import { AutoMovieEngineGeometry } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieSignedMeshQueryHit,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSignedOctahedron } from "../../internal/createSignedMeshFixture";
import { nclose, throwsError } from "../../internal/predicates";

/**
 * `createSignedMeshQuery` signs distances only on a closed, oriented
 * manifold, vertex links included.
 *
 * Fixture: the unit octahedron (|x| + |y| + |z| = 1) at x = 0, and copies at x
 * = 3 and x = 2.
 *
 * Scenarios:
 *
 * 1. The octahedra at 0 and 3 in one mesh (the second's triangles listed first):
 *    both centres are inside; (1.5, 0, 0) is outside at distance 0.5, and of
 *    its two equal nearest points the lower source ordinal, (2, 0, 0), wins.
 * 2. The octahedron unindexed (every corner repeated per face) welds and reads
 *    (2, 0, 0) at distance 1; so does it with an unused position appended.
 * 3. Without its first face, with its first face reversed, or with that face
 *    repeated it is refused ("paired oppositely wound"); touching its copy at
 *    x = 2 at one vertex it is pinched ("disconnected surface fans").
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names disconnected solids, lower ordinal ties, implicit welding and invalid boundary or vertex links.
 * @evidence contracts/development/testing.md#behavioral-verification Builds and queries octahedra with indexed and unindexed buffers, then rejects removed, reversed, duplicated and pinched configurations.
 * @evidence contracts/development/testing.md#independent-expectations The midpoint between the two disjoint solids is 0.5 from each. Coincident repeated corners of one unindexed solid weld. A point-only join gives disconnected vertex fans.
 */
export function test_engine_geometry_signed_mesh_topology(): void {
  const left: IAutoMovieMesh = createSignedOctahedron();
  const right: IAutoMovieMesh = createSignedOctahedron(3);

  // 1.
  const pair = AutoMovieEngineGeometry.createSignedMeshQuery({
    ...left,
    positions: [...left.positions, ...right.positions],
    indices: [...right.indices!.map((v: number): number => v + 6), ...left.indices!],
  });
  TestValidator.predicate("left inside", pair([0, 0, 0]).signedDistance < 0);
  TestValidator.predicate("right inside", pair([3, 0, 0]).signedDistance < 0);
  const gap: IAutoMovieSignedMeshQueryHit = pair([1.5, 0, 0]);
  TestValidator.predicate("gap outside", nclose(gap.signedDistance, 0.5));
  TestValidator.predicate("lower ordinal wins", nclose(gap.point[0], 2));

  // 2.
  const unindexed: IAutoMovieMesh = {
    ...left,
    positions: left.indices!.flatMap((v: number): number[] => left.positions.slice(3 * v, 3 * v + 3)),
    indices: null,
  };
  TestValidator.predicate(
    "welded",
    nclose(AutoMovieEngineGeometry.createSignedMeshQuery(unindexed)([2, 0, 0]).signedDistance, 1),
  );
  TestValidator.predicate(
    "unused position",
    nclose(
      AutoMovieEngineGeometry.createSignedMeshQuery({ ...left, positions: [...left.positions, 20, 20, 20] })([2, 0, 0])
        .signedDistance,
      1,
    ),
  );

  // 3.
  const reversed: number[] = [...left.indices!];
  [reversed[0], reversed[1]] = [reversed[1]!, reversed[0]!];
  const touching: IAutoMovieMesh = createSignedOctahedron(2);
  for (const [label, mesh, message] of [
    ["open", { ...left, indices: left.indices!.slice(3) }, "paired oppositely wound"],
    ["reversed face", { ...left, indices: reversed }, "paired oppositely wound"],
    ["repeated face", { ...left, indices: [...left.indices!, ...left.indices!.slice(0, 3)] }, "paired oppositely wound"],
    [
      "pinched",
      {
        ...left,
        positions: [...left.positions, ...touching.positions],
        indices: [...left.indices!, ...touching.indices!.map((v: number): number => v + 6)],
      },
      "disconnected surface fans",
    ],
  ] satisfies [string, IAutoMovieMesh, string][])
    TestValidator.predicate(label, throwsError((): unknown => AutoMovieEngineGeometry.createSignedMeshQuery(mesh), message));
}
