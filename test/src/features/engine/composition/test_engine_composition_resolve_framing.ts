import { AutoMovieEngineCompositionPose } from "@automovie/engine";
import type { IAutoMovieFramingGoal } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../../internal/predicates";

/**
 * `AutoMovieEngineCompositionPose.resolveFraming` places a camera so the subjects' enclosing sphere
 * fills the declared share of the vertical field of view, at distance `d = r /
 * (fill tan(fov / 2))`.
 *
 * Goal: fill 0.5, field of view pi / 2 (so tan(fov / 2) = 1).
 *
 * Scenarios:
 *
 * 1. One unit sphere at the origin, bearing 0: radius 1, distance 2, camera (0, 0,
 *    2).
 * 2. Two unit spheres at x = -2 and x = 2, bearing pi / 2: target (0, 0, 0),
 *    radius 3, distance 6, camera (6, 0, 0).
 * 3. An unknown subject, a fill of 0 and no subjects are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes one and two enclosing spheres and the unknown subject, zero fill and empty subject refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Calls CompositionPose.resolveFraming with resident subject spheres and authored bearing, fill and field of view, then checks the returned target, radius and camera coordinates.
 * @evidence contracts/development/testing.md#independent-expectations The symmetric spheres centred at x = -2 and x = 2 with radius 1 extend to x = -3 and +3. At half fill and a right-angle field, camera distances are twice the measured radii along the declared bearings.
 */
export function test_engine_composition_resolve_framing(): void {
  const goal = (
    subjects: string[],
    bearing: number,
    fill: number = 0.5,
  ): IAutoMovieFramingGoal => ({
    subjects,
    fill,
    bearing,
    elevation: 0,
    fieldOfView: Math.PI / 2,
  });
  const state = {
    a: { center: { x: 0, y: 0, z: 0 }, radius: 1 },
    left: { center: { x: -2, y: 0, z: 0 }, radius: 1 },
    right: { center: { x: 2, y: 0, z: 0 }, radius: 1 },
  };
  const one = AutoMovieEngineCompositionPose.resolveFraming(goal(["a"], 0), state);
  TestValidator.predicate("one radius", nclose(one.radius, 1, 1e-12));
  TestValidator.predicate(
    "one camera",
    nclose(one.position.x, 0, 1e-12) &&
      nclose(one.position.y, 0, 1e-12) &&
      nclose(one.position.z, 2, 1e-12),
  );
  const two = AutoMovieEngineCompositionPose.resolveFraming(
    goal(["left", "right"], Math.PI / 2),
    state,
  );
  TestValidator.equals("two target", two.target, { x: 0, y: 0, z: 0 });
  TestValidator.predicate("two radius", nclose(two.radius, 3, 1e-12));
  TestValidator.predicate(
    "two camera",
    nclose(two.position.x, 6, 1e-12) &&
      nclose(two.position.y, 0, 1e-12) &&
      nclose(two.position.z, 0, 1e-12),
  );
  TestValidator.predicate(
    "unknown",
    throwsError(() => AutoMovieEngineCompositionPose.resolveFraming(goal(["ghost"], 0), state)),
  );
  TestValidator.predicate(
    "fill",
    throwsError(() => AutoMovieEngineCompositionPose.resolveFraming(goal(["a"], 0, 0), state)),
  );
  TestValidator.predicate(
    "empty",
    throwsError(() => AutoMovieEngineCompositionPose.resolveFraming(goal([], 0), state)),
  );
}
