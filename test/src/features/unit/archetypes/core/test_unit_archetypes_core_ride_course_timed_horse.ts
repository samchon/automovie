import {
  type AutoMovieArchetype,
  AutoMovieArchetypeCourse,
  type AutoMovieArchetypeRide,
  createHorse,
  createPony,
  rideQuadruped,
} from "@automovie/archetypes";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/predicates";

/** The hold: the pair halts on its mark from 4 to 6 film seconds. */
const HOLD: readonly number[] = [4, 6];

/**
 * A horse and a pony ride one timed slot path with a halt and a curved resume.
 *
 * Scenarios:
 *
 * 1. Each ride follows the timed plan: its root stands on every authored mark at
 *    its second.
 * 2. No hoof lands while the animal stands on its mark, and hooves land again
 *    after it resumes.
 * 3. The seat a rider sits on holds still through the halt and rides the curve.
 * 4. The smaller pony takes more strides than the horse over the same moving path,
 *    and their landings differ, so each keeps its own gait phase.
 * 5. Forward and reversed reads give the same poses.
 */
export function test_unit_archetypes_core_ride_course_timed_horse(): void {
  const samples: readonly AutoMovieArchetypeCourse.ISample[] = [
    sample(0, 0, 0),
    sample(2, 0, 3),
    sample(HOLD[0]!, 0, 6),
    sample(HOLD[1]!, 0, 6),
    sample(8, 0, 9),
    sample(10, 0, 12),
    sample(12.5, 3, 16),
    sample(15, 7, 18),
  ];
  const plan: AutoMovieArchetypeCourse.IPlan = AutoMovieArchetypeCourse.timed(
    "slot",
    samples,
  );
  const rides: AutoMovieArchetypeRide.IRide<string, string>[] = [
    rideQuadruped(createHorse({ withersHeight: 1.7 }, 1002), plan),
    rideQuadruped(createPony({ breed: "connemara" }, 1006), plan),
  ];
  const landings: number[][] = rides.map(
    (ride: AutoMovieArchetypeRide.IRide<string, string>): number[] =>
      ride.instants
        .filter((i: { label: string }): boolean => i.label.endsWith("On"))
        .map((i: { seconds: number }): number => i.seconds),
  );
  for (const [k, ride] of rides.entries()) {
    TestValidator.predicate(
      `ride ${k} stands on every mark at its second`,
      samples.every((mark: AutoMovieArchetypeCourse.ISample): boolean =>
        vclose(
          ride.at(mark.seconds).placement.translation,
          { x: mark.x, y: 0, z: mark.z },
          1e-9,
        ),
      ),
    );
    TestValidator.predicate(
      `ride ${k} lands no hoof on its mark and lands again after resuming`,
      landings[k]!.every(
        (seconds: number): boolean =>
          seconds <= HOLD[0]! + 0.3 || seconds >= HOLD[1]!,
      ) && landings[k]!.some((seconds: number): boolean => seconds > 8),
    );
    const seat: (seconds: number) => IAutoMovieVector3 = (
      seconds: number,
    ): IAutoMovieVector3 => ride.frame("seat", seconds).translation;
    TestValidator.predicate(
      `ride ${k}'s seat holds through the halt and rides the curve`,
      vclose(seat(4.5), seat(5.5), 1e-9) && seat(15).x > seat(10).x + 5,
    );
    const times: number[] = Array.from(
      { length: 61 },
      (_: unknown, i: number): number => i / 4,
    );
    TestValidator.equals(
      `ride ${k} reads the same backward`,
      [...times].reverse().map(ride.at),
      times.map(ride.at).reverse(),
    );
  }
  const moving = (seconds: number): boolean => seconds >= HOLD[1]!;
  TestValidator.predicate(
    "the pony strides more often than the horse, each on its own phase",
    landings[1]!.filter(moving).length > landings[0]!.filter(moving).length &&
      JSON.stringify(landings[0]) !== JSON.stringify(landings[1]),
  );
}

/** A floor sample. */
function sample(
  seconds: number,
  x: number,
  z: number,
): AutoMovieArchetypeCourse.ISample {
  return { seconds, x, y: 0, z };
}
