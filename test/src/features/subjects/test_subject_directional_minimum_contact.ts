import { portraitMinimumDirectionalSurfaceTargets } from "@automovie/human/geometry/portraitDirectionalContact";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * Minimum contact retains the declared physical direction and metre scale.
 * A flat triangle above z=x in an independently constructed oblique frame needs
 * one millimetre at its second corner and zero at the others. The transform is
 * written from unit vectors, without calling the contact frame implementation.
 *
 * Scenarios:
 * 1. A non-unit oblique direction preserves transverse coordinates and the
 *    corner-derived minimum while leaving both source meshes unchanged.
 * 2. A positive quarter-millimetre clearance reaches every corner, empty support
 *    returns no targets and a zero direction is refused beside the valid ray.
 */
export const test_subject_directional_minimum_contact = (): void => {
  const s = Math.SQRT1_2;
  const mesh = (points: number[][]): IAutoMovieMesh => ({
    positions: points.flatMap(([x, y, z]) => [(x + z) * s, y, (z - x) * s]),
    indices: [0, 1, 2],
    normals: null,
    uvs: null,
    skin: null,
  });
  const front = mesh([
    [0, 0, 0],
    [0.001, 0, 0],
    [0, 0.001, 0],
  ]);
  const back = mesh([
    [0, 0, 0],
    [0.001, 0, 0.001],
    [0, 0.001, 0],
  ]);
  const original = structuredClone([front, back]);
  const direction = { x: 2, y: 0, z: 2 };
  for (const clearance of [0, 0.00025]) {
    const targets =
      clearance === 0
        ? portraitMinimumDirectionalSurfaceTargets(front, back, direction)
        : portraitMinimumDirectionalSurfaceTargets(
            front,
            back,
            direction,
            clearance,
          );
    TestValidator.equals(
      "original vertex population",
      targets.map((t) => t.vertex),
      [0, 1, 2],
    );
    for (const { vertex, target } of targets) {
      const distance = clearance + (vertex === 1 ? 0.001 : 0);
      TestValidator.predicate(
        "forward displacement in metres",
        Math.abs(target.x - front.positions[3 * vertex] - distance * s) <
          1e-10 &&
          Math.abs(target.y - front.positions[3 * vertex + 1]) < 1e-10 &&
          Math.abs(target.z - front.positions[3 * vertex + 2] - distance * s) <
            1e-10,
      );
    }
  }
  TestValidator.equals("caller geometry retained", [front, back], original);
  TestValidator.equals(
    "empty support is clear",
    portraitMinimumDirectionalSurfaceTargets(
      front,
      { ...back, positions: [], indices: [] },
      direction,
    ),
    [],
  );
  TestValidator.predicate(
    "zero direction refuses",
    throwsError(
      () =>
        portraitMinimumDirectionalSurfaceTargets(front, back, {
          x: 0,
          y: 0,
          z: 0,
        }),
      "nonzero direction",
    ),
  );
};
