import {
  AutoMovieArchetypeQuadrupedBody,
  createHorse,
  rideHorse,
  type rideQuadruped,
} from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { animalTerminalSole } from "../../internal/animalTerminalSole";
import { archetypeHorseRide } from "../../internal/archetypeHorseRide";

/**
 * The public horse route retains its actual world-space hoof supports in moving
 * and stationary parts of one performance.
 *
 * Scenarios:
 * 1. A left circle and a right circle retain actual landed hoof positions and
 *    floor clearance while the displayed body keeps moving and turning.
 * 2. Backward walking keeps the original body heading, reverses translation,
 *    and retains planted hoof positions.
 * 3. An authored 1.7-second halt between backward and forward travel holds
 *    all four supports and emits no touchdown in the interior of the halt.
 *    Reordered seeks at the two sides of the halt reproduce the original pose.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the routes, duration, real terminal supports and deterministic seek behavior.
 * @evidence contracts/development/testing.md#behavioral-verification Samples the public ride's actual model and course events, exposing lateral or longitudinal slip, spurious events during a hold and discontinuous seek state.
 * @evidence contracts/development/testing.md#independent-expectations Uses world-space geometry composed from the actual terminal transforms, the explicit level floor and authored stop interval. The 1 mm drift allowance is the existing named straight stance contract, now applied to the early grounded fraction of the backward and turning strides.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers both turn signs, moving and held time, reversing and forward travel, full soles and reordered requests through the same public route.
 * @evidence contracts/development/testing.md#execution-ownership Discoverable in-memory Archetypes regression, with no installed viewer or external asset.
 */
export function test_archetype_ride_horse_grounded(): void {
  /** One ordinary speed covered by the default walking table. */
  const cruise: number = 1.75;
  const horse: ReturnType<typeof createHorse> = createHorse({ tempo: 0 }, 7);
  const failures: string[] = [];
  for (const angle of [120, -120]) {
    const ride: ReturnType<typeof rideHorse> = rideHorse(
      horse,
      {
        start: { x: 0, z: 0, heading: 0 },
        startSpeed: cruise,
        endSpeed: cruise,
        cruise,
        acceleration: 1,
        deceleration: 1,
        legs: [{ kind: "turn", angle, radius: 8 }],
      },
      "walk",
    );
    checkStance(ride, 1, ride.duration - 1, `turn ${angle}`);
  }

  const course: rideQuadruped.ICourse = {
    start: { x: 0, z: 0, heading: 0 },
    cruise,
    acceleration: 1,
    deceleration: 1,
    speeds: [0, 0],
    legs: [
      { kind: "straight", length: 9, reverse: true, pause: 1.7 },
      { kind: "straight", length: 9 },
    ],
  };
  const ride: ReturnType<typeof rideHorse> = rideHorse(horse, course, "walk");
  const stop: number = ride.instants.find(
    (event: { label: string }): boolean => event.label === "stop1",
  )!.seconds;
  const depart: number = ride.instants.find(
    (event: { label: string }): boolean => event.label === "depart1",
  )!.seconds;
  const earlier: ReturnType<typeof ride.at> = ride.at(stop / 3);
  const later: ReturnType<typeof ride.at> = ride.at((2 * stop) / 3);
  if (
    later.placement.translation.z >= earlier.placement.translation.z ||
    Quaternion.rotateVector(later.placement.rotation, { x: 0, y: 0, z: 1 }).z <
      1 - 1e-12
  )
    failures.push("backing must reverse translation with facing preserved");
  checkStance(ride, 1, stop - 1, "rein-back");
  checkStance(ride, depart + 1, ride.duration - 1, "forward recovery");

  if (Math.abs(depart - stop - 1.7) > 1e-12)
    failures.push("the stationary interval must retain its authored duration");
  if (
    ride.instants.some(
      (event: { label: string; seconds: number }): boolean =>
        event.label.endsWith("On") &&
        event.seconds > stop + 1e-12 &&
        event.seconds < depart - 1e-12,
    )
  )
    failures.push("touchdown during an authored halt");
  for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS) {
    const times: readonly number[] = [stop + 0.25, depart - 0.25, stop + 0.85];
    const first: IAutoMovieVector3 = archetypeHorseRide.hoof(
      ride,
      limb,
      times[0]!,
    );
    for (const at of times) {
      if (
        separation(first, archetypeHorseRide.hoof(ride, limb, at)) > 1e-9 ||
        Math.abs(sole(ride, limb, at)) > 1e-9
      )
        failures.push(`${limb} fails to hold its supported halt pose`);
    }
  }
  TestValidator.equals(
    "displayed hoof support through equine travel",
    failures,
    [],
  );

  /** Read a sample of the earliest part of each observed walking stance. */
  function checkStance(
    reader: ReturnType<typeof rideHorse>,
    from: number,
    to: number,
    label: string,
  ): void {
    for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS) {
      const instants: readonly number[] = archetypeHorseRide.footfalls(
        reader,
        limb,
      );
      let worst: number = 0;
      let highest: number = 0;
      let count: number = 0;
      for (let index: number = 0; index + 1 < instants.length; ++index) {
        const start: number = instants[index]!;
        const interval: number = instants[index + 1]! - start;
        if (start < from || instants[index + 1]! > to) continue;
        const at: number = start + 0.2 * interval;
        const a: IAutoMovieVector3 = archetypeHorseRide.hoof(
          reader,
          limb,
          start + 0.01 * interval,
        );
        const b: IAutoMovieVector3 = archetypeHorseRide.hoof(reader, limb, at);
        worst = Math.max(worst, Math.hypot(a.x - b.x, a.z - b.z));
        highest = Math.max(highest, Math.abs(sole(reader, limb, at)));
        ++count;
      }
      if (count < 2 || worst >= 1e-3 || highest >= 1e-9)
        failures.push(
          `${label} ${limb}: ${count} stances, ${worst} m drift, ${highest} m clearance`,
        );
    }
  }

  /** Read the actual terminal primitive's complete support against the level set. */
  function sole(
    reader: ReturnType<typeof rideHorse>,
    limb: AutoMovieArchetypeQuadrupedBody.Limb,
    time: number,
  ): number {
    const sample: ReturnType<typeof reader.at> = reader.at(time);
    const terminal: IAutoMovieModelPart = sample.archetype.parts.find(
      (part: IAutoMovieModelPart): boolean =>
        part.id === AutoMovieArchetypeQuadrupedBody.BONES[limb][3],
    )!;
    return animalTerminalSole(terminal, sample.placement);
  }

  /** Measure ordinary spatial separation between independently observed points. */
  function separation(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
    return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  }
}
