import { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

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
 */
export const test_geometry_signed_mesh_features = (): void => {
  const source = createSignedOctahedron();
  const sample = createAutoMovieSignedMeshQuery(source);
  const cases = [
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
    const hit = sample(one.p);
    TestValidator.equals("nearest feature", hit.feature, one.feature);
    TestValidator.predicate(
      "analytic closest point",
      hit.point.every((v, k) => nclose(v, one.q[k])),
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
  const concave = createAutoMovieSignedMeshQuery(
    createSignedVoxelUnion([
      [0, 0, 0],
      [1, 0, 0],
      [0, 1, 0],
    ]),
  );
  const inner = concave([0.9, 0.9, 0.5]);
  TestValidator.equals("concave edge", inner.feature, "edge");
  TestValidator.predicate(
    "concave inner bisector",
    nclose(inner.signedDistance, -Math.sqrt(0.02)),
  );
  TestValidator.predicate(
    "notch is exterior",
    nclose(concave([1.1, 1.1, 0.5]).signedDistance, 0.1),
  );
  const reversed = createSignedOctahedron();
  for (let at = 0; at < reversed.indices!.length; at += 3)
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
  const owned = sample([2, 0, 0]);
  owned.point.fill(-100);
  owned.normal.fill(0);
  TestValidator.predicate(
    "owned snapshot and result",
    nclose(sample([2, 0, 0]).signedDistance, 1),
  );
};
