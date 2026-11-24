import {
  AutoMovieArchetypeQuadrupedBody,
  AutoMovieArchetypeQuadrupedLocomotion,
  createHorse,
  createQuadruped,
  rideHorse,
  rideQuadruped,
} from "@automovie/archetypes";
import type { IAutoMovieModelPart } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { animalTerminalSole } from "../../../internal/animalTerminalSole";
import { archetypeHorseRide } from "../../../internal/archetypeHorseRide";

/**
 * The Icelandic horse selects two distinct clocked gaits by capability.
 *
 * Scenarios:
 * 1. A representative 4 m/s tölt reads the four-beat chronology and measured
 *    fore/hind contact durations with support across the cycle.
 * 2. An 8 m/s flying pace alternates the two lateral pairs and has aerial time.
 * 3. An ordinary horse asked for either gait, or an Icelandic horse asked for
 *    flying pace outside its measured range, refuses that request.
 * 4. Switching to a copied table still admits its explicitly named gaits.
 *    An explicit list that overlaps automatic selection is refused.
 */
export function test_unit_archetypes_animals_equine_alternate_gaits(): void {
  const icelandic: ReturnType<typeof createHorse> = createHorse(
    { breed: "icelandic", withersHeight: 1.38, tempo: 0 },
    11,
  );
  const ordinary: ReturnType<typeof createHorse> = createHorse(
    { tempo: 0 },
    11,
  );
  const failures: string[] = [];
  const inCatalogue: ReturnType<typeof createQuadruped> = createQuadruped(
    { kind: "horse", breed: "icelandic", withersHeight: 1.38, tempo: 0 },
    11,
  );
  if (
    inCatalogue.provenance.models.breed !== "icelandic" ||
    createQuadruped.species(inCatalogue).table.explicit?.includes("tolt") !==
      true
  )
    failures.push("the quadruped catalogue loses the explicit horse cohort");

  const table: ReturnType<typeof AutoMovieArchetypeQuadrupedLocomotion.admit> =
    AutoMovieArchetypeQuadrupedLocomotion.admit(
      createQuadruped.species(icelandic).table,
    );
  TestValidator.error(
    "an explicit gait cannot also occur in automatic order",
    () =>
      AutoMovieArchetypeQuadrupedLocomotion.admit({
        ...table,
        explicit: ["walk", "tolt", "pace"],
      }),
  );
  for (const example of [
    {
      gait: "tolt",
      speed: 4,
      stride: 0.524,
      fore: 0.21,
      hind: 0.229,
      phase: [0, 0.5, 0.75, 0.25],
    },
    {
      gait: "pace",
      speed: 8,
      stride: 0.426,
      fore: 0.125,
      hind: 0.138,
      phase: [0, 0.5, 0, 0.5],
    },
  ] as const) {
    const course: Parameters<typeof rideHorse>[1] = {
      start: { x: 0, z: 0, heading: 0 },
      startSpeed: example.speed,
      endSpeed: example.speed,
      cruise: example.speed,
      legs: [{ kind: "straight", length: 35 }],
    };
    const ride: ReturnType<typeof rideHorse> = rideHorse(
      icelandic,
      course,
      example.gait,
    );
    const copied: ReturnType<typeof rideHorse> = rideQuadruped(
      icelandic,
      course,
      example.gait,
      table,
    );
    if (
      Math.abs(copied.duration - ride.duration) > 1e-10 ||
      Math.abs(
        copied.frame("seat", 0.25).translation.y -
          ride.frame("seat", 0.25).translation.y,
      ) > 1e-10
    )
      failures.push(
        `${example.gait} copied table changes the public carrier pose`,
      );
    const clocks: readonly number[] = archetypeHorseRide.footfalls(
      ride,
      "leftFore",
    );
    const origin: number = clocks[2]!;
    if (Math.abs(clocks[3]! - origin - example.stride) > 1e-8)
      failures.push(
        `${example.gait} stride period does not match its measured bin`,
      );
    AutoMovieArchetypeQuadrupedBody.LIMBS.forEach(
      (limb: AutoMovieArchetypeQuadrupedBody.Limb, index: number): void => {
        const expected: number =
          origin + example.phase[index]! * example.stride;
        const on: number | undefined = archetypeHorseRide
          .footfalls(ride, limb)
          .find((time: number): boolean => Math.abs(time - expected) <= 1e-8);
        if (on === undefined) {
          failures.push(`${example.gait} has a missing ${limb} event`);
          return;
        }
        const live: number = limb.endsWith("Fore")
          ? example.fore
          : example.hind;
        if (
          Math.abs(sole(ride, limb, on + live - 0.008)) > 1e-9 ||
          sole(ride, limb, on + live + 0.025) < 1e-5
        )
          failures.push(
            `${example.gait} ${limb} does not retain the expected measured contact interval`,
          );
      },
    );
    const floor: number[] = Array.from(
      { length: 24 },
      (_, index: number): number =>
        Math.min(
          ...AutoMovieArchetypeQuadrupedBody.LIMBS.map(
            (limb: AutoMovieArchetypeQuadrupedBody.Limb): number =>
              sole(ride, limb, origin + example.stride * (index / 24)),
          ),
        ),
    );
    const air: boolean = floor.some((value: number): boolean => value > 1e-5);
    if (air !== (example.gait === "pace"))
      failures.push(
        `${example.gait} display distinguishes its expected aerial phase`,
      );
    TestValidator.error(`ordinary horse does not provide ${example.gait}`, () =>
      rideHorse(ordinary, course, example.gait),
    );
  }
  TestValidator.error("flying pace requires an admitted measured speed", () =>
    rideHorse(
      icelandic,
      {
        start: { x: 0, z: 0, heading: 0 },
        cruise: 4,
        legs: [{ kind: "straight", length: 35 }],
      },
      "pace",
    ),
  );
  TestValidator.equals("measured extra equine gait observations", failures, []);

  /** Observe the independently composed rigid terminal shape against level ground. */
  function sole(
    ride: ReturnType<typeof rideHorse>,
    limb: AutoMovieArchetypeQuadrupedBody.Limb,
    time: number,
  ): number {
    const sample: ReturnType<typeof ride.at> = ride.at(time);
    const terminal: IAutoMovieModelPart = sample.archetype.parts.find(
      (part: IAutoMovieModelPart): boolean =>
        part.id === AutoMovieArchetypeQuadrupedBody.BONES[limb][3],
    )!;
    return animalTerminalSole(terminal, sample.placement);
  }
}
