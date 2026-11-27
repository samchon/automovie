import { AutoMovieArchetypeQuadrupedBody as Body, AutoMovieArchetypeQuadrupedGait as Gait, AutoMovieArchetypeQuadrupedLocomotion, createQuadruped, AutoMovieArchetypeCamel, AutoMovieArchetypeDeer, AutoMovieArchetypeOx } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { observeQuadrupedAttachment } from "./observeQuadrupedAttachment";

/** A common actual producer type with a live lead and four terminal solids. */
type Animal = ReturnType<typeof AutoMovieArchetypeCamel.create>;

/** One source observation or caller-authored clock. Durations are seconds. */
interface ICase {
  name: string;
  animal: Animal;
  gait: Gait.Gait;
  speed: number;
  clock: { period: number; foreStance: number; hindStance: number };
  table?: Gait.ITable;
}

/** Roundoff for normalizing one observed or authored cycle. */
const CLOCK_ROUNDOFF: number = 32 * Number.EPSILON;

/**
 * Reference ox, camel and deer preserve both measured and authored contracts.
 *
 * Scenarios:
 * 1. Catavitello (2018), Figure 2 supplement 2 C/D, supplies independent
 *    walking and support times. Faster points are literal authored seconds.
 * 2. Pace is lateral, trot diagonal, and the rotary gallop changes both pairs
 *    when the lead reverses.
 * 3. Each distinct body binds its real solid terminals, links and lead once.
 */
export function test_archetypes_animals_reference_attachment_clock(): void {
  const findings: string[] = [];
  const lead: NonNullable<AutoMovieArchetypeCamel.IParams["lead"]> = {
    width: 0.02,
    thickness: 0.003,
    leadLength: 0.6,
    leadRadius: 0.004,
  };
  const ox: Animal = AutoMovieArchetypeOx.create({ mass: 300, tempo: 0, lead }, 73);
  const camel: Animal = AutoMovieArchetypeCamel.create({ mass: 450, tempo: 0, lead }, 73);
  const deer: Animal = AutoMovieArchetypeDeer.create({ mass: 70, tempo: 0, lead }, 73);
  const deerTable: Gait.ITable =
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
  for (const item of cases) {
    const species: createQuadruped.ISpecies = createQuadruped.species(item.animal);
    const source: Gait.ClockSource = item.table === undefined ? species : { ...species, table: item.table };
    const clock: Gait.ITiming = Gait.timing(source, item.gait, item.speed);
    TestValidator.predicate(
      `${item.name} its period and fore/hind support`,
      clock.hindDuty !== undefined &&
        nclose(clock.stride, item.clock.period, CLOCK_ROUNDOFF) &&
        nclose(clock.stride * clock.duty, item.clock.foreStance, CLOCK_ROUNDOFF) &&
        nclose(clock.stride * clock.hindDuty, item.clock.hindStance, CLOCK_ROUNDOFF),
    );
    if (item.gait === "walk") continue;
    // Lateral and diagonal pairs have unchanged leads. Rotary gallop lands
    // LH/RH/RF/LF from the previous LF, then mirrors about the next LF origin.
    const [left, right]: readonly [readonly number[], readonly number[]] =
      item.gait === "pace"
        ? [[0, 0.5, 0, 0.5], [0, 0.5, 0, 0.5]]
        : item.gait === "trot"
          ? [[0, 0.5, 0.5, 0], [0, 0.5, 0.5, 0]]
          : [[0, 0.75, 0.25, 0.5], [0, 0.25, 0.75, 0.5]];
    for (const [lead, expected] of [["left", left], ["right", right]] as const)
      Body.LIMBS.forEach((limb, index): void => {
        TestValidator.predicate(
          `${item.name}/${lead}/${limb} authored landing`,
          nclose(Gait.phase(source, { gait: item.gait, lead }, limb), expected[index]!, CLOCK_ROUNDOFF),
        );
      });
  }
  for (const animal of [ox, camel, deer])
    observeQuadrupedAttachment(animal, createQuadruped.species(animal), animal.archetype, findings, animal.dimensions.withersHeight!);
  TestValidator.equals(
    "actual reference-species attachment and solid support",
    findings,
    [],
  );
}
