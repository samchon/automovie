import {
  AutoMovieArchetypeCourse,
  AutoMovieArchetypeRefusal,
  createHorse,
  rideQuadruped,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

/** One timed sample: film second and the root's world X and Z, metres. */
interface IMark {
  /** Film second. */
  seconds: number;
  /** World X, metres. */
  x: number;
  /** World Z, metres. */
  z: number;
}

/**
 * A horse ridden on a timed formation route keeps every planted hoof within its limb's reach through a trotting bend, and a route it cannot follow refuses with a typed reason naming the second.
 *
 * Scenarios:
 * 1. The mounted-passage lead route from a halt into a 3 m sidestep bend at a trot samples every 0.05 s without a reach failure.
 * 2. A route that doubles the sidestep in the same time, beyond the gaits' declared speeds, refuses with an AutoMovieArchetypeRefusal rather than a raw RangeError.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the route, the sampling and the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Samples the public ride over the bend and catches the refusal type.
 * @evidence contracts/development/testing.md#independent-expectations The route is the mounted-passage lead route that failed; the expectation is that a feasible ride samples and an infeasible one refuses with the typed error the ride contract states.
 * @evidence contracts/development/testing.md#distinguishing-cases A feasible bend and an infeasible one.
 * @evidence contracts/development/testing.md#execution-ownership A memory-only archetype unit.
 */
export function test_archetype_equine_timed_bend(): void {
  const issues: string[] = [];
  const marks: readonly IMark[] = [
    { seconds: 6, x: -1.5, z: 10 },
    { seconds: 8, x: -1.5, z: 13 },
    { seconds: 9.5, x: -1.5, z: 15 },
    { seconds: 11, x: -1.5, z: 15 },
    { seconds: 12.5, x: -1.5, z: 17 },
    { seconds: 14, x: -1.5, z: 19 },
    { seconds: 16, x: -4.5, z: 23 },
    { seconds: 18, x: -4.5, z: 27 },
  ];
  const ride = rideQuadruped(
    createHorse({}, "hazel"),
    AutoMovieArchetypeCourse.timed("hazel", marks),
  );
  for (let at: number = 6; at <= 18; at += 0.05)
    try {
      ride.at(at);
    } catch (error) {
      issues.push(
        `${at.toFixed(2)} s: ${error instanceof Error ? error.message : String(error)}`,
      );
      break;
    }
  let refusal: unknown;
  try {
    const wide = rideQuadruped(
      createHorse({}, "hazel"),
      AutoMovieArchetypeCourse.timed(
        "hazel",
        marks.map(
          (mark: IMark): IMark => ({
            ...mark,
            x: mark.seconds >= 16 ? -30 : mark.x,
          }),
        ),
      ),
    );
    for (let at: number = 6; at <= 18; at += 0.05) wide.at(at);
  } catch (error) {
    refusal = error;
  }
  if (!(refusal instanceof AutoMovieArchetypeRefusal))
    issues.push(`the infeasible route raises ${String(refusal)}`);
  TestValidator.equals("timed bend reach", issues, []);
}
