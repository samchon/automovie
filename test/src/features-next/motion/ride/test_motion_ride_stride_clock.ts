import {
  AutoMovieArchetypeQuadrupedLocomotion,
  createCamel,
  createDeer,
  createDog,
  rideQuadruped,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { animalLocomotionFixture as fixture } from "../../../features/internal/animalLocomotionFixture";
import { throwsError } from "../../../features/internal/throwsError";

/**
 * A ride chooses an admissible gait and publishes its authored period on the course's absolute clock.
 *
 * Scenarios:
 * 1. Camel pace, deer trot or gallop, and measured dog gaits use their distinct declared periods.
 * 2. Delaying the entire course shifts the same landing by the start offset.
 * 3. An unavailable gait or gap in the recorded speed domain refuses preparation.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads successive actual forefoot landing instants.
 * @evidence contracts/development/testing.md#independent-expectations The gait records and authored start offset define the period and shift.
 * @evidence contracts/development/testing.md#distinguishing-cases Explicit and automatic gait selection meet at the same measured speed.
 * @evidence contracts/development/testing.md#execution-ownership Builds only analytic ride plans.
 * @evidence contracts/development/common.md#meaningful-documentation States the public time domain and admission.
 */
export function test_motion_ride_stride_clock(): void {
  const camel = createCamel({ ...createCamel.REFERENCE, tempo: 0 }, 73),
    deer = createDeer({ tempo: 0 }, 73),
    dog = createDog({ mass: 22, tempo: 0 }, 73);
  const clock = (speed: number, stride: number) => ({
    speed,
    stride,
    foreStance: stride / 2,
    hindStance: stride / 2,
  });
  const camels = AutoMovieArchetypeQuadrupedLocomotion.camel({
    pace: [clock(3, 1)],
  });
  const deerGaits = AutoMovieArchetypeQuadrupedLocomotion.deer({
    trot: [clock(2, 0.6)],
    gallop: [clock(4, 0.5)],
  });
  const gaps = (
    events: ReadonlyArray<
      Pick<fixture.Ride["instants"][number], "label" | "seconds">
    >,
  ): number[] =>
    events.filter((e) => e.label === "leftForeOn").map((e) => e.seconds);
  for (const [ride, period] of [
    [rideQuadruped(camel, fixture.course(3), undefined, camels), 1],
    [rideQuadruped(deer, fixture.course(2), undefined, deerGaits), 0.6],
    [rideQuadruped(deer, fixture.course(4), undefined, deerGaits), 0.5],
    [rideQuadruped(dog, fixture.course(0.9)), 1.11],
    [rideQuadruped(dog, fixture.course(2.69)), 0.57],
    [rideQuadruped(dog, fixture.course(4.34)), 0.45],
  ] as const) {
    const times = gaps(ride.instants).filter(
      (t) => t > 0.5 && t < ride.duration - 1,
    );
    TestValidator.predicate(
      "two consecutive landings span the declared stride",
      times.length >= 2 && Math.abs(times[1]! - times[0]! - period) <= 1e-9,
    );
  }
  const course = fixture.course(3),
    delay = 2.375;
  const first = gaps(rideQuadruped(camel, course, "pace", camels).instants);
  const shifted = gaps(
    rideQuadruped(camel, { ...course, at: delay }, "pace", camels).instants,
  );
  TestValidator.predicate(
    "each landing shifts with the course",
    first.length === shifted.length &&
      first.every((t, i) => Math.abs(t + delay - shifted[i]!) <= 1e-9),
  );
  TestValidator.predicate(
    "unregistered pace",
    throwsError(() => rideQuadruped(camel, course, "pace")),
  );
  TestValidator.predicate(
    "unsupported gap between measured gaits",
    throwsError(() => rideQuadruped(dog, fixture.course(1.5))),
  );
}
