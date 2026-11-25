import { Quaternion } from "@automovie/engine";
import type { IAutoMovieQuaternion } from "@automovie/interface";
import { rotationBetween } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/**
 * `rotationBetween` is the least rotation carrying one unit direction onto
 * another, about their common normal.
 *
 * Scenarios:
 *
 * 1. +X onto +Z is a quarter turn that carries +X onto +Z.
 * 2. A direction onto itself is no rotation.
 */
export function test_motions_tasks_rotation_between(): void {
  const turn: IAutoMovieQuaternion = rotationBetween(
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 0, z: 1 },
  );
  TestValidator.predicate(
    "a quarter turn onto +Z",
    vclose(
      Quaternion.rotateVector(turn, { x: 1, y: 0, z: 0 }),
      { x: 0, y: 0, z: 1 },
      1e-12,
    ),
  );
  TestValidator.equals(
    "no rotation onto itself",
    rotationBetween({ x: 0, y: 1, z: 0 }, { x: 0, y: 1, z: 0 }),
    Quaternion.identity(),
  );
}
