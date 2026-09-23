import { Vector3 } from "@automovie/engine";
import { createHumanFaceHairGatherField } from "@automovie/human/face/anatomy/hair/createHumanFaceHairGatherField";
import { resolveHumanFaceHairGatherAnchor } from "@automovie/human/face/anatomy/hair/resolveHumanFaceHairGatherAnchor";
import { TestValidator } from "@nestia/e2e";

import { createSignedVoxelUnion } from "../internal/createSignedMeshFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * A tie's attraction follows the current scalp graph and stays tangent to it.
 * Scenarios:
 * 1. From an analytic cube side, the local field points upward toward a crown
 *    tie and has unit length; the source positions remain caller-owned.
 * 2. A symmetric equal-distance triangle falls back to a direct tangent, while
 *    disconnected and degenerate growth surfaces refuse by name.
 */
export const test_subject_human_hair_gather_field = (): void => {
  const cube = createSignedVoxelUnion([[0, 0, 0]]);
  const original = cube.positions.slice();
  const triangles = Array.from(
    { length: cube.indices!.length / 3 },
    (_, index) => index,
  );
  const anchor = resolveHumanFaceHairGatherAnchor({
    origin: Vector3.create(0.5, 0.5, 0.5),
    positions: cube.positions,
    current: cube.positions,
    indices: cube.indices!,
    triangles,
    polar: 0,
    azimuth: 0,
  });
  const field = createHumanFaceHairGatherField({
    positions: cube.positions,
    indices: cube.indices!,
    triangles,
    anchor,
  });
  const side = field(Vector3.create(1, 0.5, 0.5));
  TestValidator.predicate(
    "current scalp distance descends toward crown",
    side.y > 0 && nclose(Vector3.length(side), 1),
  );
  TestValidator.predicate(
    "field does not move source positions",
    cube.positions.every((value, at) => value === original[at]),
  );
  const triangle = {
    positions: [1, 0, 0, -1, 0, 0, 0, 0, 1],
    indices: [0, 1, 2],
    triangles: [0],
    anchor: {
      point: Vector3.create(),
      triangle: 0,
    },
  };
  const symmetric = createHumanFaceHairGatherField(triangle);
  const direct = symmetric(Vector3.create(0.2, 0, 0.2));
  TestValidator.predicate(
    "equal-distance triangle keeps a tangent direction",
    direct.x < 0 && direct.z < 0 && nclose(Vector3.length(direct), 1),
  );
  const disconnected = createSignedVoxelUnion([
    [0, 0, 0],
    [3, 0, 0],
  ]);
  TestValidator.predicate(
    "disconnected scalp refuses",
    throwsError(
      () =>
        createHumanFaceHairGatherField({
          positions: disconnected.positions,
          indices: disconnected.indices!,
          triangles: Array.from(
            { length: disconnected.indices!.length / 3 },
            (_, index) => index,
          ),
          anchor,
        }),
      "connect every root",
    ),
  );
  TestValidator.predicate(
    "tie outside shared domain refuses",
    throwsError(
      () =>
        createHumanFaceHairGatherField({
          positions: cube.positions,
          indices: cube.indices!,
          triangles: triangles.slice(0, 2),
          anchor,
        }),
      "must belong to its shared scalp domain",
    ),
  );
  TestValidator.predicate(
    "collapsed current triangle refuses",
    throwsError(
      () =>
        createHumanFaceHairGatherField({
          ...triangle,
          positions: [0, 0, 0, 0, 0, 0, 0, 0, 0],
        }),
      "nondegenerate triangles",
    ),
  );
};
