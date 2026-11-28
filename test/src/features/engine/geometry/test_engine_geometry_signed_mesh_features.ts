import { AutoMovieEngineGeometry } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieSignedMeshQueryHit,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  createSignedOctahedron,
  createSignedVoxelUnion,
} from "../../internal/createSignedMeshFixture";
import { nclose } from "../../internal/predicates";

/**
 * `createSignedMeshQuery` reads the nearest face, edge or vertex of the
 * actual solid, its closest point, unit pseudonormal and oriented distance.
 *
 * Fixtures: the unit octahedron |x| + |y| + |z| = 1; the L of three unit voxels
 * at (0,0,0), (1,0,0) and (0,1,0).
 *
 * Scenarios:
 *
 * 1. Octahedron: (0.5, 0.5, 0.5) and (0.2, 0.2, 0.2) meet the face x + y + z = 1
 *    at (1/3, 1/3, 1/3), at +0.5 / sqrt 3 and -0.4 / sqrt 3; (0.7, 0.7, 0) meets
 *    the edge at (0.5, 0.5, 0), sqrt 0.08 away; (+-2, 0, 0) meet the vertex
 *    (+-1, 0, 0), 1 away; the unsigned distance is the absolute value, and the
 *    normal is unit.
 * 2. Boundary points (1,0,0), (0.5,0.5,0) and (0.25,0.25,0.5) are at distance 0.
 * 3. The L's concave edge at (1, 1, z): its inner bisector (0.9, 0.9, 0.5) reads
 *    the edge at -sqrt 0.02; the notch (1.1, 1.1, 0.5) is outside at 0.1.
 * 4. The octahedron wound inside out reads (2, 0, 0) at -1.
 * 5. Overwriting the source buffers or a returned hit changes no later reading.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names closest feature types, signed geometry, concavity, reversed winding and snapshot ownership.
 * @evidence contracts/development/testing.md#behavioral-verification Queries actual octahedron and voxel-solid surfaces at authored points and checks returned coordinates, normals and distance signs.
 * @evidence contracts/development/testing.md#independent-expectations Projection onto x+y+z=1 gives the face point (1/3,1/3,1/3). Closest edge and vertex coordinates follow from the same unit planes, and the voxel notch supplies a concave control.
 */
export function test_engine_geometry_signed_mesh_features(): void {
  const source: IAutoMovieMesh = createSignedOctahedron();
  const sample = AutoMovieEngineGeometry.createSignedMeshQuery(source);
  const s3: number = Math.sqrt(3);

  // 1.
  for (const [p, q, d, feature] of [
    [[0.5, 0.5, 0.5], [1 / 3, 1 / 3, 1 / 3], 0.5 / s3, "face"],
    [[0.2, 0.2, 0.2], [1 / 3, 1 / 3, 1 / 3], -0.4 / s3, "face"],
    [[0.7, 0.7, 0], [0.5, 0.5, 0], Math.sqrt(0.08), "edge"],
    [[2, 0, 0], [1, 0, 0], 1, "vertex"],
    [[-2, 0, 0], [-1, 0, 0], 1, "vertex"],
  ] satisfies [number[], number[], number, IAutoMovieSignedMeshQueryHit["feature"]][]) {
    const hit: IAutoMovieSignedMeshQueryHit = sample(p);
    TestValidator.equals(`${p} feature`, hit.feature, feature);
    TestValidator.predicate(`${p} point`, hit.point.every((v: number, k: number): boolean => nclose(v, q[k]!)));
    TestValidator.predicate(`${p} signed`, nclose(hit.signedDistance, d));
    TestValidator.predicate(`${p} unsigned`, nclose(hit.distance, Math.abs(d)));
    TestValidator.predicate(`${p} unit normal`, nclose(Math.hypot(...hit.normal), 1));
  }

  // 2.
  for (const p of [
    [1, 0, 0],
    [0.5, 0.5, 0],
    [0.25, 0.25, 0.5],
  ])
    TestValidator.predicate(`${p} on the surface`, nclose(sample(p).distance, 0));

  // 3.
  const voxels = AutoMovieEngineGeometry.createSignedMeshQuery(
    createSignedVoxelUnion([
      [0, 0, 0],
      [1, 0, 0],
      [0, 1, 0],
    ]),
  );
  const inner: IAutoMovieSignedMeshQueryHit = voxels([0.9, 0.9, 0.5]);
  TestValidator.equals("concave edge", inner.feature, "edge");
  TestValidator.predicate("inner bisector", nclose(inner.signedDistance, -Math.sqrt(0.02)));
  TestValidator.predicate("notch outside", nclose(voxels([1.1, 1.1, 0.5]).signedDistance, 0.1));

  // 4.
  const reversed: IAutoMovieMesh = createSignedOctahedron();
  const ix: number[] = reversed.indices!;
  for (let at: number = 0; at < ix.length; at += 3) [ix[at], ix[at + 1]] = [ix[at + 1]!, ix[at]!];
  TestValidator.predicate("inside out", nclose(AutoMovieEngineGeometry.createSignedMeshQuery(reversed)([2, 0, 0]).signedDistance, -1));

  // 5.
  source.positions.fill(400);
  source.indices!.fill(0);
  const hit: IAutoMovieSignedMeshQueryHit = sample([2, 0, 0]);
  hit.point.fill(-100);
  hit.normal.fill(0);
  TestValidator.predicate("owned snapshot", nclose(sample([2, 0, 0]).signedDistance, 1));
}
