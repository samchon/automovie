import {
  ArchetypeUnits,
  createExerciseBike,
  createExerciseMat,
  createJumpRope,
  createRing,
  createRowingMachine,
  createSled,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";
import { archetypeModelSweep } from "../internal/archetypeModelSweep";
import { archetypePlaced } from "../internal/archetypePlaced";

/**
 * The gym additions are placed in a scene where they were put, and their act-read sizes stay inside their sources for every seed, measured on the produced thing.
 *
 * Scenarios:
 * 1. The sled, the rowing machine, the exercise bike, both exercise mats, the skipping rope and the ring, placed on a line through the public chain, each turned a different way: each rests at its placement on the floor, its lowest point on the floor within a millimetre, and every contact it declares is a named point of the prop at its own place.
 * 2. Over 200 seeds the ring's canvas is 1 m high and its top rope 1.3 m above it (the AIBA guide); and each of these is exactly one read model, every model drawn: the rowing machine's seat top and mass, Concept2's standard legs' 14 in and 57 lb or tall legs' 20 in and 68 lb; the skipping rope's cable, Rogue's 120 in or 11 ft, with its handle, the SR-1S's 5.25, SR-1's 6.75 or SR-1L's 7.5 in; the sled's base length and width, handle height and mass, Rogue's Slice or Echo Dog; a yoga mat's length and mass, Manduka's 71 in at 3.4 kg or 85 in at 4.3 kg.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places every archetype of the family through the public chain and reads the displayed prop frames, and measures colliders on the produced things; one that floats, sinks, drops a contact or leaves its source's band fails with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations The bands and models are written here from the sources each producer cites.
 * @evidence contracts/development/testing.md#distinguishing-cases Every producer and kind for placement; one act-read size per producer for the bands, each read model's figures together for the picks.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man for the placing performance and in-memory models; it runs locally and wherever CI runs the archetype tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the two scenarios and what each pins.
 */
export function test_archetype_gym_placed(): void {
  const findings: string[] = archetypePlaced([
    { name: "sled", archetype: createSled(), yaw: 0 },
    { name: "rowingMachine", archetype: createRowingMachine(), yaw: 45 },
    { name: "exerciseBike", archetype: createExerciseBike(), yaw: 90 },
    ...createExerciseMat.KINDS.map(
      (kind: createExerciseMat.Kind): archetypePlaced.IRow => ({
        name: `exerciseMat-${kind}`,
        archetype: createExerciseMat({ kind }),
        yaw: 135,
      }),
    ),
    { name: "jumpRope", archetype: createJumpRope(), yaw: 180 },
    { name: "ring", archetype: createRing(), yaw: 225 },
  ]);
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    source: string,
    measure: (seed: number) => number,
  ): archetypeBandSweep.IRow => ({
    name,
    minimum,
    maximum,
    source,
    measure,
    tolerance: 1e-9,
  });
  findings.push(
    ...archetypeBandSweep([
      row(
        "ring canvas height",
        1,
        1,
        "the AIBA guide, 230 cm poles 130 cm above the canvas",
        (seed: number): number =>
          archetypeExtent(createRing({}, seed), "y", ["platform"]).high,
      ),
      row(
        "ring top rope",
        1.3,
        1.3,
        "the AIBA guide, the top rope 130 cm above the canvas",
        (seed: number): number =>
          archetypeExtent(createRing({}, seed), "y", ["northRope4"]).high -
          createRing({}, seed).dimensions.platform! -
          createRing.ROPE / 2,
      ),
    ]),
  );
  const inch: number = ArchetypeUnits.INCH;
  const pound: number = ArchetypeUnits.POUND;
  findings.push(
    ...archetypeModelSweep([
      {
        name: "rowing seat height and mass",
        measure: (seed: number): readonly number[] => {
          const rower: ReturnType<typeof createRowingMachine> =
            createRowingMachine({}, seed);
          return [archetypeExtent(rower, "y", ["seat"]).high, rower.body.mass];
        },
        models: [
          [14 * inch, 57 * pound],
          [20 * inch, 68 * pound],
        ],
        source: "Concept2, the standard and tall legs",
      },
      {
        name: "skipping rope cable and handle",
        measure: (seed: number): readonly number[] => {
          const rope: ReturnType<typeof createJumpRope> = createJumpRope(
            {},
            seed,
          );
          return [
            archetypeExtent(rope, "x", ["cord"]).size,
            archetypeExtent(rope, "x", ["leftHandle"]).size,
          ];
        },
        models: [120 * inch, 132 * inch].flatMap((cable: number): number[][] =>
          [5.25 * inch, 6.75 * inch, 7.5 * inch].map(
            (handle: number): number[] => [cable, handle],
          ),
        ),
        source: "Rogue SR-1, its cables and handles",
      },
      {
        name: "sled base, handle height and mass",
        measure: (seed: number): readonly number[] => {
          const sled: ReturnType<typeof createSled> = createSled({}, seed);
          return [
            archetypeExtent(sled, "z", ["base"]).size,
            archetypeExtent(sled, "x", ["base"]).size,
            archetypeExtent(sled, "y", ["leftPole"]).high,
            sled.body.mass,
          ];
        },
        models: [
          [27.5 * inch, 22.75 * inch, 37.25 * inch, 65 * pound],
          [36.5 * inch, 25 * inch, 37.5 * inch, 87 * pound],
        ],
        source: "Rogue's Slice and Echo Dog sleds",
      },
      {
        name: "yoga mat length and mass",
        measure: (seed: number): readonly number[] => {
          const mat: ReturnType<typeof createExerciseMat> = createExerciseMat(
            { kind: "yoga" },
            seed,
          );
          return [archetypeExtent(mat, "z").size, mat.body.mass];
        },
        models: [
          [71 * inch, 3.4],
          [85 * inch, 4.3],
        ],
        source: "Manduka PRO 6 mm",
      },
    ]),
  );
  TestValidator.equals("the gym additions are placed and sized", findings, []);
}
