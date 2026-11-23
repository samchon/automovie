import {
  AutoMovieArchetypeCourse,
  AutoMovieArchetypeQuadrupedGait,
  AutoMovieArchetypeRefusal,
  createHorse,
  createQuadruped,
  rideQuadruped,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeHorseRide } from "../internal/archetypeHorseRide";

/** One timed sample: film second and the root's world X and Z, metres. */
interface IMark {
  /** Film second. */
  seconds: number;
  /** World X, metres. */
  x: number;
  /** World Z, metres. */
  z: number;
}

/** One stretch of the speed profile: from its second, linearly to its speed by the next stretch. */
interface IStretch {
  /** Film second the stretch's speed is reached. */
  seconds: number;
  /** Speed then, metres per second. */
  speed: number;
}

/**
 * A mare departs from standing, walks into the trot and slows back through the walk to a stretch slower than the slowest measured walk, which she walks on at that row's cadence; every instant samples and no planted hoof slides.
 *
 * Scenarios:
 * 1. A 1.6 m mare stands for a second, accelerates to 3 m/s, trots, slows to 0.8 m/s, below the 1.077 m/s floor of the measured walk at her height, walks there for two seconds and speeds up again: every 20 ms samples, a `gait:walk-trot` and a later `gait:trot-walk` change appear, and no planted hoof slides.
 * 2. The same slow stretch named as a trot refuses with an AutoMovieArchetypeRefusal naming the trot.
 * 3. A crowd-sampled start, equal marks until it moves and marks every 0.5 s of a 3 m/s^2 start to 3 m/s, never runs back along its line and rides every 20 ms.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the profile, the floor and the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Samples the public ride and reads its gait instants and planted hooves.
 * @evidence contracts/development/testing.md#independent-expectations The walk's declared floor at 1.6 m is read from the species' table; the slow stretch lies below it.
 * @evidence contracts/development/testing.md#distinguishing-cases An automatic gait below the floor, a named trot there, and a coarse-sampled start out of a hold.
 * @evidence contracts/development/testing.md#execution-ownership A memory-only archetype unit.
 */
export function test_archetype_equine_timed_walk_floor(): void {
  const horse = createHorse({ withersHeight: 1.6, tempo: 0 }, "mare");
  const floor: number = AutoMovieArchetypeQuadrupedGait.range(
    createQuadruped.species(horse),
    "walk",
    1.6,
  ).minimum;
  const issues: string[] = [];
  if (!(0.8 < floor))
    issues.push(`the walk floor ${floor} m/s is not above the slow stretch`);
  const profile: readonly IStretch[] = [
    { seconds: 1, speed: 0 },
    { seconds: 3, speed: 3 },
    { seconds: 5, speed: 3 },
    { seconds: 7, speed: 0.8 },
    { seconds: 9, speed: 0.8 },
    { seconds: 10, speed: 1.5 },
  ];
  const marks: IMark[] = [{ seconds: 0, x: 0, z: 0 }];
  let z: number = 0;
  for (let k: number = 1; k <= 100; k++) {
    const seconds: number = k * 0.1;
    const at: number = seconds - 0.05;
    const next: number = profile.findIndex(
      (stretch: IStretch): boolean => stretch.seconds >= at,
    );
    const from: IStretch = profile[Math.max(0, next - 1)]!;
    const to: IStretch = profile[next]!;
    const speed: number =
      at <= profile[0]!.seconds
        ? 0
        : from.speed +
          ((to.speed - from.speed) * (at - from.seconds)) /
            (to.seconds - from.seconds);
    z += speed * 0.1;
    marks.push({ seconds, x: 0, z });
  }
  const ride = rideQuadruped(
    horse,
    AutoMovieArchetypeCourse.timed("mare", marks),
  );
  for (let at: number = 0; at <= ride.duration; at += 0.02)
    try {
      ride.at(at);
    } catch (error) {
      issues.push(
        `at ${at.toFixed(2)} s: ${error instanceof Error ? error.message : String(error)}`,
      );
      break;
    }
  const up: number | undefined = ride.instants.find(
    (event): boolean => event.label === "gait:walk-trot",
  )?.seconds;
  const down: number | undefined = ride.instants.find(
    (event): boolean => event.label === "gait:trot-walk",
  )?.seconds;
  if (!(up !== undefined && down !== undefined && down > up))
    issues.push(`gait changes: up ${up} s, down ${down} s`);
  const slide: number = archetypeHorseRide.slide(ride).worst;
  if (!(slide <= 1e-9)) issues.push(`a planted hoof slides ${slide} m`);
  let refusal: unknown;
  try {
    rideQuadruped(horse, AutoMovieArchetypeCourse.timed("mare", marks), "trot");
  } catch (error) {
    refusal = error;
  }
  if (
    !(
      refusal instanceof AutoMovieArchetypeRefusal &&
      /trot/.test(refusal.message)
    )
  )
    issues.push(`a named trot below its floor raises ${String(refusal)}`);

  // 3. A crowd-sampled departure: equal marks to 2 s, then marks every 0.5 s of a 3 m/s^2 start to 3 m/s.
  const crowd: IMark[] = Array.from(
    { length: 13 },
    (_: unknown, k: number): IMark => {
      const seconds: number = k * 0.5;
      const moving: number = Math.max(0, seconds - 2.4);
      const along: number =
        moving <= 1 ? 1.5 * moving * moving : 1.5 + 3 * (moving - 1);
      return { seconds, x: 0.26 * along, z: 0.966 * along };
    },
  );
  const plan: AutoMovieArchetypeCourse.IPlan = AutoMovieArchetypeCourse.timed(
    "mare",
    crowd,
  );
  let back: number = 0;
  for (let at: number = 2; at <= 3.5; at += 0.01) {
    const before: AutoMovieArchetypeCourse.IState = plan.at(at);
    const after: AutoMovieArchetypeCourse.IState = plan.at(at + 0.01);
    back = Math.max(
      back,
      -(
        (after.placement.translation.x - before.placement.translation.x) *
          0.26 +
        (after.placement.translation.z - before.placement.translation.z) * 0.966
      ),
    );
  }
  if (back > 0) issues.push(`the departure runs back ${back} m along its line`);
  const start = rideQuadruped(horse, plan);
  for (let at: number = 0; at <= start.duration; at += 0.02)
    try {
      start.at(at);
    } catch (error) {
      issues.push(
        `crowd departure at ${at.toFixed(2)} s: ${error instanceof Error ? error.message : String(error)}`,
      );
      break;
    }
  TestValidator.equals("walking below the measured floor", issues, []);
}
