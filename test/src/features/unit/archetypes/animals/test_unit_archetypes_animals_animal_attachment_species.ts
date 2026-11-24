import {
  type AutoMovieArchetypeQuadrupedBody,
  type AutoMovieArchetypeQuadrupedGait,
  AutoMovieArchetypeQuadrupedLocomotion,
  type AutoMovieArchetypeRide,
  createCamel,
  createDeer,
  createOx,
  rideQuadruped,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { animalAttachmentScenario as scenario } from "../../../internal/animalAttachmentScenario";

/** A common actual source type; all three producers own the same closed contact vocabulary. */
type Animal = ReturnType<typeof createCamel>;

/** One actual positive reference, with an independently stated contact clock. */
interface ICase {
  /** Complete producer/gait label. */
  name: string;
  /** Actual coherent source reference with a real lead. */
  animal: Animal;
  /** Declared shared gait name. */
  gait: AutoMovieArchetypeQuadrupedGait.Gait;
  /** Speed in metres per second, at an actual supported point. */
  speed: number;
  /** Independent seconds, derived from source fractions or explicitly authored. */
  clock: scenario.IClock;
  /** Explicit faster clocks; absent means the actual registered walking table. */
  table?: AutoMovieArchetypeQuadrupedGait.ITable;
}

/**
 * New reference species use the same actual attachments and solid-foot contract.
 *
 * Scenarios:
 * 1. The canonical ox, camel and deer walking points run successfully on both
 *    leads with complete actual bar/parent/contact observations.
 * 2. Caller-authored camel pace and sika trot/rotary gallop use that same
 *    observation path, without substituting a static model for missing support.
 * 3. Every case checks exact touchdown/liftoff +/-1 microsecond, off-grid
 *    planted and lifted solids, finite unit TRS, source preservation and replay.
 */
export function test_unit_archetypes_animals_animal_attachment_species(): void {
  const findings: string[] = [];
  const lead: NonNullable<createCamel.IParams["lead"]> = {
    width: 0.02,
    thickness: 0.003,
    leadLength: 0.6,
    leadRadius: 0.004,
  };
  const ox: Animal = createOx({ mass: 300, tempo: 0, lead }, 73);
  const camel: Animal = createCamel({ mass: 450, tempo: 0, lead }, 73);
  const deer: Animal = createDeer({ mass: 70, tempo: 0, lead }, 73);
  const deerTable: AutoMovieArchetypeQuadrupedGait.ITable =
    AutoMovieArchetypeQuadrupedLocomotion.deer({
      trot: [{ speed: 2, stride: 0.6, foreStance: 0.3, hindStance: 0.3 }],
      gallop: [{ speed: 4, stride: 0.5, foreStance: 0.2, hindStance: 0.2 }],
    });
  const cases: readonly ICase[] = [
    {
      name: "ox/walk",
      animal: ox,
      gait: "walk",
      speed: 0.71,
      clock: {
        period: 1.3083333333333333,
        foreStance: 1.3083333333333333 * 0.7410615271441992,
        hindStance: 1.3083333333333333 * 0.6880389797326112,
      },
    },
    {
      name: "camel/walk",
      animal: camel,
      gait: "walk",
      speed: 1.08,
      clock: {
        period: 1.7333333333333336,
        foreStance: 1.7333333333333336 * 0.7194109095774127,
        hindStance: 1.7333333333333336 * 0.66768111169193,
      },
    },
    {
      name: "deer/walk",
      animal: deer,
      gait: "walk",
      speed: 0.78,
      clock: {
        period: 1.136111111111111,
        foreStance: 1.136111111111111 * 0.7704956892177161,
        hindStance: 1.136111111111111 * 0.7239413565500523,
      },
    },
    {
      name: "camel/authored-pace",
      animal: camel,
      gait: "pace",
      speed: 3,
      clock: { period: 1, foreStance: 0.45, hindStance: 0.45 },
      table: AutoMovieArchetypeQuadrupedLocomotion.camel({
        pace: [{ speed: 3, stride: 1, foreStance: 0.45, hindStance: 0.45 }],
      }),
    },
    {
      name: "deer/authored-trot",
      animal: deer,
      gait: "trot",
      speed: 2,
      clock: { period: 0.6, foreStance: 0.3, hindStance: 0.3 },
      table: deerTable,
    },
    {
      name: "deer/authored-rotary-gallop",
      animal: deer,
      gait: "gallop",
      speed: 4,
      clock: { period: 0.5, foreStance: 0.2, hindStance: 0.2 },
      table: deerTable,
    },
  ];
  for (const item of cases)
    for (const side of ["left", "right"] as const)
      scenario(
        item.animal,
        (): AutoMovieArchetypeRide.IRide<
          Parameters<Animal["affordance"]>[0],
          AutoMovieArchetypeQuadrupedBody.Dimension
        > =>
          rideQuadruped(
            item.animal,
            {
              start: { x: 2, z: -3, heading: 29 },
              legs: [{ kind: "straight", length: item.speed * 6, lead: side }],
              cruise: item.speed,
              startSpeed: item.speed,
              endSpeed: item.speed,
            },
            item.gait,
            item.table,
          ),
        item.clock,
        `${item.name}/${side}`,
        findings,
      );
  TestValidator.equals(
    "actual reference-species attachment and solid support",
    findings,
    [],
  );
}
