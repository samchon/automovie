import {
  AutoMovieArchetypeQuadrupedBody as Body,
  AutoMovieArchetypeQuadrupedGait as Gait,
  AutoMovieArchetypeQuadrupedLocomotion,
  AutoMovieArchetypeQuadrupedMotion,
  createDog,
  createQuadruped,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { observeQuadrupedAttachment } from "./observeQuadrupedAttachment";

/** Roundoff for normalized duty times and phase rebasing in one stride. */
const CLOCK_ROUNDOFF: number = 32 * Number.EPSILON;

/**
 * Three canine cohorts retain their support clocks and solved attachments.
 *
 * Scenarios:
 * 1. Pet, Show and Sled use the observed walking, trotting and galloping
 *    periods and distinct fore/hind support. Both leads keep their leg order.
 * 2. The fixed and lifted solid-foot goals preserve each body's actual links,
 *    lead carrier and source ownership.
 * 3. An authored 20-degree support nod peaks ten degrees nose-up at lift-off
 *    and moves the actual head and its carrier.
 */
export function test_archetypes_animals_canine_attachment_clock(): void {
  const findings: string[] = [];
  for (const cohort of ["pet", "show", "sled"] as const) {
    const dog: ReturnType<typeof createDog> = createDog(
      {
        mass: 22,
        cohort,
        tempo: 0,
        collar: { width: 0.02, thickness: 0.003, leadLength: 0.6, leadRadius: 0.004 },
      },
      43,
    );
    const species: createQuadruped.ISpecies = createQuadruped.species(dog);
    // Light (2010) walk and Choi (2021), Table 1, faster timings. The gallop
    // phases here describe the declared transverse construction, not dog ROM.
    for (const [gait, speed, period, fore, hind, left, right] of [
      ["walk", 0.75, 1.11, 0.62, 0.56, [0, 0.5, 0.85, 0.35], [0, 0.5, 0.85, 0.35]],
      ["trot", 2.69, 0.57, 0.23, 0.21, [0, 0.5, 0.5, 0], [0, 0.5, 0.5, 0]],
      ["gallop", 4.34, 0.45, 0.14, 0.16, [0, 0.8, 0.6, 0.3], [0, 0.2, 0.5, 0.8]],
    ] as const) {
      const clock: Gait.ITiming = Gait.timing(species, gait, speed, 0, dog.dimensions.withersHeight!);
      TestValidator.predicate(
        `${cohort}/${gait} source stride and support`,
        clock.hindDuty !== undefined &&
          nclose(clock.stride, period, CLOCK_ROUNDOFF) &&
          nclose(clock.duty * clock.stride, fore, CLOCK_ROUNDOFF) &&
          nclose(clock.hindDuty * clock.stride, hind, CLOCK_ROUNDOFF),
      );
      for (const [lead, phases] of [["left", left], ["right", right]] as const)
        Body.LIMBS.forEach((limb, index): void => {
          TestValidator.predicate(
            `${cohort}/${gait}/${lead}/${limb} landing`,
            nclose(Gait.phase(species, { gait, lead }, limb), phases[index]!, CLOCK_ROUNDOFF),
          );
        });
    }
    let nod: number = 2;
    if (cohort === "pet") {
      const table: Gait.ITable = AutoMovieArchetypeQuadrupedLocomotion.admit(species.table);
      table.gaits.walk!.nod = { range: 20, timing: "support" };
      const duty: number = 0.62 / 1.11;
      const degrees: number = AutoMovieArchetypeQuadrupedMotion.nod(
        { ...species, table }, { gait: "walk", lead: "left" }, duty, duty,
      );
      TestValidator.equals("an authored support nod reaches half its range at lift-off", degrees, -10);
      nod = degrees;
    }
    observeQuadrupedAttachment(dog, species, `dog/${cohort}`, findings, dog.dimensions.withersHeight!, nod);
  }
  TestValidator.equals("canine clocks, attachment and solid support", findings, []);
}
