import {
  AutoMovieArchetypeCourse,
  AutoMovieArchetypeRefusal,
  createBicycle,
  rideBicycle,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * A bicycle wheeled by hand out of a transition and back into it freewheels
 * twice on one course: the crank holds its phase through each coast while
 * both wheels roll by distance.
 *
 * Scenarios:
 * 1. Over two coasting stretches the crank does not turn and the wheels
 *    advance by the stretch over the circumference.
 * 2. Between them the crank turns by the pedalled distance over the
 *    development.
 * 3. Overlapping or unordered stretches are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the two coasts, the pedalled stretch and the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the ride's own articulation travels at course positions.
 * @evidence contracts/development/testing.md#independent-expectations Wheel circumference and the gear's development give the expected travels; a freewheel holds the crank.
 * @evidence contracts/development/testing.md#distinguishing-cases Two coasts, the pedalled stretch between them, and two malformed interval lists.
 * @evidence contracts/development/testing.md#execution-ownership In-memory archetype ride.
 */
export function test_archetype_ride_bicycle_coasts(): void {
  const bicycle: ReturnType<typeof createBicycle> = createBicycle({}, 8);
  const plan: AutoMovieArchetypeCourse.IPlan = AutoMovieArchetypeCourse.plan(
    "bicycle",
    {
      start: { x: 0, z: 0, heading: 0 },
      legs: [
        { kind: "straight", length: 6 },
        { kind: "straight", length: 20 },
        { kind: "straight", length: 8 },
      ],
      speeds: [2, 5, 0],
      cruise: 5,
      acceleration: 2,
      deceleration: 2,
    },
  );
  const ride: ReturnType<typeof rideBicycle> = rideBicycle(bicycle, plan, {
    chainring: 34,
    sprocket: 17,
    coast: [
      [0, 6],
      [26, 34],
    ],
  });
  const circumference: number = Math.PI * bicycle.dimensions.wheelDiameter!;
  const development: number = circumference * 2;
  const travel = (distance: number, part: createBicycle.Affordance): number =>
    ride.at(plan.when(distance)).archetype.travel(part);
  const unwrap = (a: number, b: number): number =>
    (((b - a) % 360) + 360) % 360;
  TestValidator.predicate(
    "the crank holds through both coasts",
    nclose(travel(1, "crank"), travel(5, "crank"), 1e-6) &&
      nclose(travel(27, "crank"), travel(33, "crank"), 1e-6),
  );
  TestValidator.predicate(
    "the wheels roll by distance while coasting",
    nclose(
      unwrap(travel(1, "rearSpin"), travel(5, "rearSpin")),
      ((4 / circumference) * 360) % 360,
      1e-6,
    ),
  );
  TestValidator.predicate(
    "the crank turns with the pedalled stretch",
    nclose(
      unwrap(travel(8, "crank"), travel(10, "crank")),
      ((2 / development) * 360) % 360,
      1e-6,
    ),
  );
  for (const coast of [
    [
      [0, 6],
      [5, 8],
    ],
    [
      [10, 12],
      [2, 4],
    ],
  ] as const) {
    let refusal: unknown;
    try {
      rideBicycle(bicycle, plan, { chainring: 34, sprocket: 17, coast });
    } catch (error: unknown) {
      refusal = error;
    }
    TestValidator.predicate(
      "overlapping or unordered coasts are refused",
      refusal instanceof AutoMovieArchetypeRefusal,
    );
  }
}
