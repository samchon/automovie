import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { rotationBetween } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/**
 * `rotationBetween` is the least rotation carrying one unit direction onto
 * another. Opposite directions turn about a perpendicular axis.
 *
 * Scenarios:
 *
 * 1. +X onto +Z is a quarter turn that carries +X onto +Z.
 * 2. A direction onto itself is no rotation.
 * 3. +Z onto -Z maps the source to the opposite direction.
 * 4. A 5e-10 radian correction toward +X reaches the requested direction.
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

  const forward: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
  const backward: IAutoMovieVector3 = { x: 0, y: 0, z: -1 };
  TestValidator.predicate(
    "a half turn reaches the antiparallel direction",
    vclose(
      Quaternion.rotateVector(rotationBetween(forward, backward), forward),
      backward,
      1e-12,
    ),
  );

  const angle: number = 5e-10;
  const nearForward: IAutoMovieVector3 = {
    x: Math.sin(angle),
    y: 0,
    z: Math.cos(angle),
  };
  TestValidator.predicate(
    "a correction below one nanoradian remains active",
    vclose(
      Quaternion.rotateVector(rotationBetween(forward, nearForward), forward),
      nearForward,
      1e-12,
    ),
  );
}
