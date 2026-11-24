import {
  type AutoMovieArchetypeQuadrupedBody,
  type AutoMovieArchetypeQuadrupedGait,
  AutoMovieArchetypeQuadrupedLocomotion,
  type AutoMovieArchetypeRide,
  createDog,
  createQuadruped,
  rideQuadruped,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { animalAttachmentScenario as scenario } from "../../../internal/animalAttachmentScenario";

/**
 * Every canine gait preserves real parent attachments and complete solid support.
 *
 * Scenarios:
 * 1. Pet, Show and Sled prototypes each walk, trot and gallop on both leads.
 *    Actual parent-local proximal joints, four lengths, adjacent endpoints,
 *    cylinder soles, lead contacts and finite unit transforms are observed.
 * 2. Exact touchdown/liftoff and +/-1 microsecond neighborhoods, off-grid
 *    stance/swing samples and film endpoints preserve continuous attachment;
 *    planted world footprints hold and actual soles touch the floor.
 * 3. A separately authored twenty-degree walking nod moves the real head and
 *    its actual lead carrier without moving the source attachments.
 * 4. Preparation, unordered seeking and mutation of a returned model/contact/
 *    placement preserve the source and later replay for every positive case.
 */
export function test_unit_archetypes_animals_animal_attachment_dog(): void {
  const findings: string[] = [];
  for (const cohort of ["pet", "show", "sled"] as const)
    for (const [gait, speed, period, foreStance, hindStance] of [
      ["walk", 0.75, 1.11, 0.62, 0.56],
      ["trot", 2.69, 0.57, 0.23, 0.21],
      ["gallop", 4.34, 0.45, 0.14, 0.16],
    ] as const)
      for (const lead of ["left", "right"] as const) {
        const dog: ReturnType<typeof createDog> = createDog(
          {
            mass: 22,
            cohort,
            tempo: 0,
            collar: {
              width: 0.02,
              thickness: 0.003,
              leadLength: 0.6,
              leadRadius: 0.004,
            },
          },
          43,
        );
        scenario(
          dog,
          (): AutoMovieArchetypeRide.IRide<
            createDog.Affordance,
            AutoMovieArchetypeQuadrupedBody.Dimension
          > =>
            rideQuadruped(
              dog,
              {
                start: { x: 2, z: -3, heading: 29 },
                legs: [{ kind: "straight", length: speed * 6, lead }],
                cruise: speed,
                startSpeed: speed,
                endSpeed: speed,
              },
              gait,
            ),
          { period, foreStance, hindStance },
          `dog/${cohort}/${gait}/${lead}`,
          findings,
        );
      }

  const dog: ReturnType<typeof createDog> = createDog(
    {
      mass: 22,
      cohort: "pet",
      tempo: 0,
      collar: {
        width: 0.02,
        thickness: 0.003,
        leadLength: 0.6,
        leadRadius: 0.004,
      },
    },
    43,
  );
  const authored: AutoMovieArchetypeQuadrupedGait.ITable =
    AutoMovieArchetypeQuadrupedLocomotion.admit(
      createQuadruped.species(dog).table,
    );
  authored.gaits.walk!.nod = { range: 20, timing: "support" };
  scenario(
    dog,
    (): AutoMovieArchetypeRide.IRide<
      createDog.Affordance,
      AutoMovieArchetypeQuadrupedBody.Dimension
    > =>
      rideQuadruped(
        dog,
        {
          start: { x: -4, z: 2, heading: -37 },
          legs: [{ kind: "straight", length: 4.5 }],
          cruise: 0.75,
          startSpeed: 0.75,
          endSpeed: 0.75,
        },
        "walk",
        authored,
      ),
    { period: 1.11, foreStance: 0.62, hindStance: 0.56, headMustMove: true },
    "dog/authored-head-nod",
    findings,
  );
  TestValidator.equals(
    "actual canine attachment and solid support",
    findings,
    [],
  );
}
