import { Quaternion, lookRotation } from "@automovie/engine";
import {
  type IAutoMovieQuaternion,
  type IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, qclose, qunit, vclose } from "../internal/predicates";

const FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: -1 };
const RIGHT: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };

/**
 * Camera aim maps local -Z onto the requested direction and keeps local X horizontal away from the vertical degeneracy.
 *
 * Scenarios:
 *
 * 1. Straight ahead (−Z) → identity.
 * 2. Behind (+Z) exercises a half turn, and pure sides (±X) exercise quarter turns.
 * 3. Four compound diagonal aims keep the horizon level.
 * 4. Straight down and straight up: the up-parallel degenerates, resolved against
 *    the +Z reference (roll is unconstrained there, so only the forward mapping
 *    is pinned).
 * 5. A zero direction states no aim and answers the identity, the level rest
 *    orientation, instead of a camera rolled upside down.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls lookRotation for eight ordinary aims, two vertical aims and zero, checking unit norm, forward mapping, nonvertical horizon and identity, catching a shortest-arc solution that aims correctly but rolls the camera.
 * @evidence contracts/testing.md#independent-expectations The authored direction divided by its independently computed Math.hypot norm defines the requested forward vector, local X must have zero world Y for a level horizon, and zero or negative-Z aim has the stated identity behavior. Quaternion.rotateVector observes the returned rotation, so these are numerical orientation checks rather than rendered pixels.
 * @evidence contracts/testing.md#distinguishing-cases Preserves straight ahead/behind, both pure sides, four compound diagonals, exact up/down and zero; vertical cases constrain forward mapping without promising a unique roll. Near-vertical thresholds and nonfinite inputs are outside this set.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_film_camera_look_rotation entry owns every in-process direction and shared numerical predicate, without installing a consumer or starting a process, native artifact, viewer or GPU.
 */
export function test_film_camera_look_rotation(): void {
  const level: IAutoMovieVector3[] = [
    { x: 0, y: 0, z: -1 },
    { x: 0, y: 0, z: 1 },
    { x: 1, y: 0, z: 0 },
    { x: -1, y: 0, z: 0 },
    { x: 2.2, y: 0.33, z: -1.35 },
    { x: -1.35, y: 0.33, z: 2.2 },
    { x: 0.5, y: -0.8, z: 0.5 },
    { x: -0.5, y: 0.8, z: -0.5 },
  ];
  for (const direction of level) {
    const q: IAutoMovieQuaternion = lookRotation(direction);
    const length: number = Math.hypot(direction.x, direction.y, direction.z);
    TestValidator.predicate(`unit ${JSON.stringify(direction)}`, qunit(q));
    TestValidator.predicate(
      `forward lands ${JSON.stringify(direction)}`,
      vclose(Quaternion.rotateVector(q, FORWARD), {
        x: direction.x / length,
        y: direction.y / length,
        z: direction.z / length,
      }),
    );
    TestValidator.predicate(
      `horizon level ${JSON.stringify(direction)}`,
      nclose(Quaternion.rotateVector(q, RIGHT).y, 0, 1e-9),
    );
  }
  TestValidator.predicate(
    "identity straight ahead",
    nclose(lookRotation({ x: 0, y: 0, z: -1 }).w, 1),
  );

  for (const direction of [
    { x: 0, y: -1, z: 0 },
    { x: 0, y: 1, z: 0 },
  ]) {
    const q: IAutoMovieQuaternion = lookRotation(direction);
    TestValidator.predicate(
      `degenerate forward ${JSON.stringify(direction)}`,
      vclose(Quaternion.rotateVector(q, FORWARD), direction),
    );
  }

  TestValidator.predicate(
    "zero direction answers the identity",
    qclose(lookRotation({ x: 0, y: 0, z: 0 }), { x: 0, y: 0, z: 0, w: 1 }),
  );
}
