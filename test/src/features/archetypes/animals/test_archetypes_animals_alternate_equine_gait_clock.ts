import {
  AutoMovieArchetypeEquineGait,
  AutoMovieArchetypeQuadrupedBody,
  AutoMovieArchetypeQuadrupedGait as Gait,
  AutoMovieArchetypeQuadrupedLocomotion,
  createQuadruped,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Roundoff budget for scaled timing and at most four cyclic interval endpoints. */
const CLOCK_TOLERANCE: number = 32 * Number.EPSILON;

/**
 * The Icelandic clock admits measured tölt and pace with different support.
 *
 * Scenarios:
 * 1. The catalogue-selected breed exposes both measured clocks. Admitting a
 *    copy preserves their periods, distinct fore/hind durations and footfalls.
 * 2. The closed-form union of one stride's stance intervals covers the whole
 *    tölt stride and leaves an aerial interval in flying pace.
 * 3. An ordinary horse lacks the two explicit gaits, flying pace refuses the
 *    wrong speed, and an explicit gait cannot also enter automatic order.
 */
export function test_archetypes_animals_alternate_equine_gait_clock(): void {
  const horse: ReturnType<typeof createQuadruped> = createQuadruped(
    { kind: "horse", breed: "icelandic", withersHeight: 1.38, tempo: 0 },
    11,
  );
  const species: Gait.ClockSource = createQuadruped.species(horse);
  TestValidator.predicate(
    "the catalogue selects the two explicit Icelandic gaits",
    horse.provenance.models.breed === "icelandic" &&
      species.table.explicit?.includes("tolt") === true &&
      species.table.explicit.includes("pace"),
  );
  const admitted: Gait.ClockSource = {
    archetype: species.archetype,
    table: AutoMovieArchetypeQuadrupedLocomotion.admit(species.table),
  };
  const ordinary: Gait.ClockSource = {
    archetype: "horse",
    table: AutoMovieArchetypeEquineGait.TABLE,
  };

  // Robilliard, Pfau and Wilson (2007), Tables 1 and 2, at the 1.38 m
  // reference. The order of the four observations is LF, RF, LH, RH.
  for (const example of [
    {
      gait: "tolt",
      speed: 4,
      stride: 0.524,
      fore: 0.21,
      hind: 0.229,
      phase: [0, 0.5, 0.75, 0.25],
      aerial: false,
    },
    {
      gait: "pace",
      speed: 8,
      stride: 0.426,
      fore: 0.125,
      hind: 0.138,
      phase: [0, 0.5, 0, 0.5],
      aerial: true,
    },
  ] as const) {
    for (const clock of [species, admitted]) {
      const timing: Gait.ITiming = Gait.timing(clock, example.gait, example.speed);
      TestValidator.predicate(
        `${example.gait} keeps the measured stride and separate stance durations`,
        timing.hindDuty !== undefined &&
          nclose(timing.stride, example.stride, CLOCK_TOLERANCE) &&
          nclose(timing.duty * timing.stride, example.fore, CLOCK_TOLERANCE) &&
          nclose(timing.hindDuty * timing.stride, example.hind, CLOCK_TOLERANCE),
      );
      const windows: readonly (readonly [number, number])[] =
        AutoMovieArchetypeQuadrupedBody.LIMBS.map(
          (limb: AutoMovieArchetypeQuadrupedBody.Limb, index: number): readonly [number, number] => {
            const phase: number = Gait.phase(clock, { gait: example.gait, lead: "left" }, limb);
            TestValidator.predicate(
              `${example.gait} ${limb} has its measured landing phase`,
              nclose(phase, example.phase[index]!, CLOCK_TOLERANCE),
            );
            return [phase, limb.endsWith("Fore") ? timing.duty : timing.hindDuty!];
          },
        );
      TestValidator.equals(
        `${example.gait} has the expected support union`,
        hasAerialInterval(windows),
        example.aerial,
      );
    }
    TestValidator.error(`the ordinary horse lacks ${example.gait}`, () =>
      Gait.of(ordinary, example.gait),
    );
  }
  TestValidator.error("4 m/s is outside the flying pace measurements", () =>
    Gait.timing(admitted, "pace", 4),
  );
  TestValidator.error("explicit gait may not overlap automatic order", () =>
    AutoMovieArchetypeQuadrupedLocomotion.admit({
      ...admitted.table,
      explicit: ["walk", "tolt", "pace"],
    }),
  );
}

/** Between consecutive landing/lift endpoints the support set is constant. */
function hasAerialInterval(windows: readonly (readonly [number, number])[]): boolean {
  const edges: readonly number[] = [
    0,
    1,
    ...windows.flatMap(([start, duty]): number[] => [start, (start + duty) % 1]),
  ].sort((left: number, right: number): number => left - right);
  return edges.some((right: number, index: number): boolean => {
    const left: number = edges[index - 1] ?? right;
    if (right === left) return false;
    const middle: number = (left + right) / 2;
    return windows.every(([start, duty]): boolean => (middle - start + 1) % 1 >= duty);
  });
}
