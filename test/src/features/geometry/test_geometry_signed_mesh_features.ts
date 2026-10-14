import { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import { type IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { type IAutoMovieSignedMeshQueryHit } from "@automovie/engine";
import {
  createSignedOctahedron,
  createSignedVoxelUnion,
} from "../internal/createSignedMeshFixture";
import { nclose } from "../internal/predicates";

/**
 * Signed distance uses the nearest face, edge or vertex of the actual solid.
 * Scenarios:
 * 1. The unit L1 ball has plane x+y+z=1, edge x+y=1,z=0 and vertex (1,0,0).
 * 2. A three-voxel L has a concave edge at (1,1,z); its inner bisector is inside.
 * 3. Boundary points have zero distance, and reversing winding reverses sign.
 * 4. Caller and result mutations cannot alter a compiled geometry snapshot.
 *
 * @evidence contracts/testing.md#behavioral-verification Queries the existing octahedron and concave three-voxel L, asserting feature identity, analytic witness, signed/unsigned distance and unit pseudonormal; boundary points retain zero, reversed winding flips the sign and caller/result mutations cannot change a later compiled reading.
 * @evidence contracts/testing.md#independent-expectations Projection onto x+y+z=1, the x+y=1 edge and axis vertices yields the authored closest points and distances. The L's inner bisector is minus sqrt(0.02) while the notch is 0.1 outside. Existing nclose tolerances allow binary64 approximation; these chosen analytic features do not certify every surface or renderer, and the last ownership probe directly rechecks signed distance only.
 * @evidence contracts/testing.md#distinguishing-cases Preserves exterior/interior faces, edge and both axis vertices, three exact surface supports, concave inside versus notch outside, globally reversed winding and compiled/output ownership. General BVH exhaustiveness, closed-manifold admission and sheet rims belong to companion entries.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry directly invokes portable signed-query source with the existing octahedron/voxel fixtures and scalar observer. It installs no consumer, builds no native artifact and starts no process, browser or GPU; all original cases remain locally owned without dynamic registration.
 */
export function test_geometry_signed_mesh_features(): void {
  const source: IAutoMovieMesh = createSignedOctahedron();
  const sample: (point: readonly number[]) => IAutoMovieSignedMeshQueryHit =
    createAutoMovieSignedMeshQuery(source);
  const cases: ReadonlyArray<{
    p: readonly number[];
    q: readonly number[];
    d: number;
    feature: IAutoMovieSignedMeshQueryHit["feature"];
  }> = [
    {
      p: [0.5, 0.5, 0.5],
      q: [1 / 3, 1 / 3, 1 / 3],
      d: 0.5 / Math.sqrt(3),
      feature: "face",
    },
    {
      p: [0.2, 0.2, 0.2],
      q: [1 / 3, 1 / 3, 1 / 3],
      d: -0.4 / Math.sqrt(3),
      feature: "face",
    },
    { p: [0.7, 0.7, 0], q: [0.5, 0.5, 0], d: Math.sqrt(0.08), feature: "edge" },
    { p: [2, 0, 0], q: [1, 0, 0], d: 1, feature: "vertex" },
    { p: [-2, 0, 0], q: [-1, 0, 0], d: 1, feature: "vertex" },
  ] as const;
  for (const one of cases) {
    const hit: IAutoMovieSignedMeshQueryHit = sample(one.p);
    TestValidator.equals("nearest feature", hit.feature, one.feature);
    TestValidator.predicate(
      "analytic closest point",
      hit.point.length === one.q.length &&
        hit.point.every((v: number, k: number): boolean => nclose(v, one.q[k])),
    );
    TestValidator.predicate(
      "oriented distance",
      nclose(hit.signedDistance, one.d),
    );
    TestValidator.predicate(
      "unsigned distance",
      nclose(hit.distance, Math.abs(one.d)),
    );
    TestValidator.predicate(
      "unit pseudonormal",
      nclose(Math.hypot(...hit.normal), 1),
    );
  }
  for (const p of [
    [1, 0, 0],
    [0.5, 0.5, 0],
    [0.25, 0.25, 0.5],
  ])
    TestValidator.predicate("surface contact", nclose(sample(p).distance, 0));
  const concave: (point: readonly number[]) => IAutoMovieSignedMeshQueryHit =
    createAutoMovieSignedMeshQuery(
      createSignedVoxelUnion([
        [0, 0, 0],
        [1, 0, 0],
        [0, 1, 0],
      ]),
    );
  const inner: IAutoMovieSignedMeshQueryHit = concave([0.9, 0.9, 0.5]);
  TestValidator.equals("concave edge", inner.feature, "edge");
  TestValidator.predicate(
    "concave inner bisector",
    nclose(inner.signedDistance, -Math.sqrt(0.02)),
  );
  TestValidator.predicate(
    "notch is exterior",
    nclose(concave([1.1, 1.1, 0.5]).signedDistance, 0.1),
  );
  const reversed: IAutoMovieMesh = createSignedOctahedron();
  for (let at: number = 0; at < reversed.indices!.length; at += 3)
    [reversed.indices![at], reversed.indices![at + 1]] = [
      reversed.indices![at + 1],
      reversed.indices![at],
    ];
  TestValidator.predicate(
    "orientation owns sign",
    nclose(
      createAutoMovieSignedMeshQuery(reversed)([2, 0, 0]).signedDistance,
      -1,
    ),
  );
  source.positions.fill(400);
  source.indices!.fill(0);
  const owned: IAutoMovieSignedMeshQueryHit = sample([2, 0, 0]);
  owned.point.fill(-100);
  owned.normal.fill(0);
  TestValidator.predicate(
    "owned snapshot and result",
    nclose(sample([2, 0, 0]).signedDistance, 1),
  );
}
