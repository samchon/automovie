import { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import { type IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { type IAutoMovieSignedMeshQueryHit } from "@automovie/engine";
import { createSignedOctahedron } from "../internal/createSignedMeshFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * The sign precondition is a closed oriented manifold, including vertex links.
 * Scenarios:
 * 1. Two disjoint octahedra have two interiors and an exterior gap, with stable
 *    source-order resolution of equal-distance features through both BVH arms.
 * 2. Exact UV-split/nonindexed copies weld; unused source vertices are harmless.
 * 3. Open, inconsistently wound, multiply incident and pinched surfaces refuse.
 *
 * @evidence contracts/testing.md#behavioral-verification Compiles the existing disjoint octahedra, checking both interiors, the exterior gap and source-order witness tie. Exact split/nonindexed copies and an unused position preserve distance, while open, flipped, repeated-face and point-pinched surfaces must refuse at their edge/link boundary.
 * @evidence contracts/testing.md#independent-expectations Unit L1 balls centred at X zero and three leave half a metre from X=1.5 to either nearest vertex; right-member triangles occur first, so the witness X is two. Authored edge incidence and disconnected vertex fans define refusals. Existing scalar tolerances and these samples do not prove arbitrary surface embedding or exhaustive sign classification.
 * @evidence contracts/testing.md#distinguishing-cases Preserves two components versus exterior gap, reversed member index order, exact duplicated render coordinates, implicit indices, unused vertices and all four open/winding/incidence/link failures. General feature distances, hierarchy pruning and open-sheet acceptance are owned by companion entries.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry directly calls portable signed-query source on the existing octahedron fixtures and canonical scalar/exception observers. It installs no consumer, builds no native artifact and starts no host, browser or GPU; no cases are dynamically registered.
 */
export function test_geometry_signed_mesh_topology(): void {
  const left: IAutoMovieMesh = createSignedOctahedron(),
    right: IAutoMovieMesh = createSignedOctahedron(3);
  const pair: IAutoMovieMesh = {
    ...left,
    positions: [...left.positions, ...right.positions],
    indices: [
      ...right.indices!.map((v: number): number => v + 6),
      ...left.indices!,
    ],
  };
  const sample: (point: readonly number[]) => IAutoMovieSignedMeshQueryHit =
    createAutoMovieSignedMeshQuery(pair);
  TestValidator.predicate(
    "left interior",
    sample([0, 0, 0]).signedDistance < 0,
  );
  TestValidator.predicate(
    "right interior",
    sample([3, 0, 0]).signedDistance < 0,
  );
  const gap: IAutoMovieSignedMeshQueryHit = sample([1.5, 0, 0]);
  TestValidator.predicate(
    "space between solids stays exterior",
    nclose(gap.signedDistance, 0.5),
  );
  TestValidator.predicate(
    "source ordinal breaks equal-distance ties",
    nclose(gap.point[0], 2),
  );
  const unindexed: IAutoMovieMesh = {
    ...left,
    positions: left.indices!.flatMap((v: number): number[] =>
      left.positions.slice(3 * v, 3 * v + 3),
    ),
    indices: null,
  };
  TestValidator.predicate(
    "exact coordinate seam welding",
    nclose(
      createAutoMovieSignedMeshQuery(unindexed)([2, 0, 0]).signedDistance,
      1,
    ),
  );
  const unused: IAutoMovieMesh = {
    ...left,
    positions: [...left.positions, 20, 20, 20],
  };
  TestValidator.predicate(
    "unused source position",
    nclose(createAutoMovieSignedMeshQuery(unused)([2, 0, 0]).signedDistance, 1),
  );
  const open: IAutoMovieMesh = { ...left, indices: left.indices!.slice(3) };
  const inconsistent: IAutoMovieMesh = structuredClone(left);
  [inconsistent.indices![0], inconsistent.indices![1]] = [
    inconsistent.indices![1],
    inconsistent.indices![0],
  ];
  const repeated: IAutoMovieMesh = {
    ...left,
    indices: [...left.indices!, ...left.indices!.slice(0, 3)],
  };
  const touching: IAutoMovieMesh = createSignedOctahedron(2);
  const pinched: IAutoMovieMesh = {
    ...left,
    positions: [...left.positions, ...touching.positions],
    indices: [
      ...left.indices!,
      ...touching.indices!.map((v: number): number => v + 6),
    ],
  };
  for (const [index, mesh] of [open, inconsistent, repeated, pinched].entries())
    TestValidator.predicate(
      "invalid closed manifold refused",
      throwsError(
        (): ((point: readonly number[]) => IAutoMovieSignedMeshQueryHit) =>
          createAutoMovieSignedMeshQuery(mesh),
        index === 3 ? "disconnected surface fans" : "paired oppositely wound",
      ),
    );
}
