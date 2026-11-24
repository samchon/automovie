import {
  AutoMovieArchetypeQuadrupedBody,
  createHorse,
  rideHorse,
  type rideQuadruped,
} from "@automovie/archetypes";
import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { animalTerminalSole } from "../internal/animalTerminalSole";
import { archetypeHorseRide } from "../internal/archetypeHorseRide";
import { archetypeRestObservation } from "../internal/archetypeRestObservation";
import { vclose } from "../internal/vclose";

/**
 * A timed course can start from the recovered actual standing footprints.
 *
 * Each emitted hoof matches its neutral solid at the join. At least one hoof
 * swings while others maintain real support and a later touchdown.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the grounded recovery-to-travel join and actual emitted shape observations.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the real horse and native course, checking four physical terminal parts at the start and the first step.
 * @evidence contracts/development/testing.md#independent-expectations The rested neutral model owns the initial endpoints. Actual cylinder supports and the known positive authored ramp distinguish swing from ground contact.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks exact start, nearby seek, first swing and touchdown. A moving start with the standing flag refuses.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory fixture reads actual parts and the public ride clock without external state.
 */
export function test_archetype_equine_standing_departure(): void {
  const horse: ReturnType<typeof createHorse> = createHorse({
    tack: "bare",
    withersHeight: 1.72,
    tempo: 0,
  });
  const course: rideQuadruped.ICourse = {
    start: { x: 0, z: 0, heading: 0 },
    cruise: 1.6,
    startSpeed: 0,
    endSpeed: 1.6,
    acceleration: 1,
    deceleration: 1,
    startFromStanding: true,
    legs: [{ kind: "straight", length: 9 }],
  };
  const departure: ReturnType<typeof rideHorse> = rideHorse(
    horse,
    course,
    "walk",
  );
  const first: number = Math.min(
    ...AutoMovieArchetypeQuadrupedBody.LIMBS.flatMap(
      (limb: AutoMovieArchetypeQuadrupedBody.Limb): number[] =>
        archetypeHorseRide.footfalls(departure, limb),
    ),
  );
  TestValidator.predicate(
    "a hoof actually lands after the standing departure",
    () => first > 0,
  );
  const swing: ReturnType<typeof departure.at> = departure.at(first / 2);
  const landed: ReturnType<typeof departure.at> = departure.at(first);
  const soles: number[] = [];
  for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS) {
    const id: AutoMovieArchetypeQuadrupedBody.Bone =
      AutoMovieArchetypeQuadrupedBody.BONES[limb][3];
    const neutral: IAutoMovieModelPart = horse.parts.find(
      (part: IAutoMovieModelPart): boolean => part.id === id,
    )!;
    const atStart: IAutoMovieVector3 = archetypeHorseRide.hoof(
      departure,
      limb,
      0,
    );
    const next: IAutoMovieVector3 = archetypeHorseRide.hoof(
      departure,
      limb,
      1e-5,
    );
    const rested: IAutoMovieVector3 = archetypeRestObservation.endpoint(
      neutral,
      1,
    );
    TestValidator.predicate(
      `${limb} standing-to-ride entry`,
      vclose(atStart, rested, 1e-8),
    );
    TestValidator.predicate(
      `${limb} stays continuous at entry`,
      vclose(next, rested, 1e-6),
    );
    soles.push(
      animalTerminalSole(
        swing.archetype.parts.find(
          (part: IAutoMovieModelPart): boolean => part.id === id,
        )!,
        swing.placement,
      ),
    );
    if (archetypeHorseRide.footfalls(departure, limb)[0] === first)
      TestValidator.predicate(
        `${limb} first landing reaches the actual floor`,
        () =>
          Math.abs(
            animalTerminalSole(
              landed.archetype.parts.find(
                (part: IAutoMovieModelPart): boolean => part.id === id,
              )!,
              landed.placement,
            ),
          ) < 1e-9,
      );
  }
  TestValidator.predicate(
    "the first swinging hoof accompanies actual ground supports",
    () =>
      soles.some((sole: number): boolean => sole > 1e-4) &&
      soles.some((sole: number): boolean => Math.abs(sole) < 1e-9) &&
      soles.every((sole: number): boolean => sole >= -1e-9),
  );
  TestValidator.error(
    "the standing contract refuses an already moving start",
    () => rideHorse(horse, { ...course, startSpeed: 1.6 }, "walk"),
  );
}
