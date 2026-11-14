import {
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
import { archetypePlaced } from "../internal/archetypePlaced";

/**
 * The gym additions are placed in a scene where they were put, and their act-read sizes stay inside their sources for every seed, measured on the produced thing.
 *
 * Scenarios:
 * 1. The sled, the rowing machine, the exercise bike, both exercise mats, the skipping rope and the ring, placed on a line through the public chain, each turned a different way: each rests at its placement on the floor, its lowest point on the floor within a millimetre, and every contact it declares is a named point of the prop at its own place.
 * 2. Over 200 seeds: the rowing machine's seat top 0.36 to 0.51 m high (the maker's standard and tall legs); the ring's canvas 0.91 to 1.22 m high and its top rope 1.30 to 1.35 m above it (the rules); the skipping rope 2.4 to 3 m end to end (makers'); the sled's handles 0.95 to 1.2 m high (makers').
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places every archetype of the family through the public chain and reads the displayed prop frames, and measures colliders on the produced things; one that floats, sinks, drops a contact or leaves its source's band fails with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations The bands are written here from the sources each producer cites.
 * @evidence contracts/development/testing.md#distinguishing-cases Every producer and kind for placement; one act-read size per producer for the bands.
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
        "rowing seat height",
        0.36,
        0.51,
        "Concept2, 14 and 20 in seats",
        (seed: number): number =>
          archetypeExtent(createRowingMachine({}, seed), "y", ["seat"]).high,
      ),
      row(
        "ring canvas height",
        0.91,
        1.22,
        "the ring rules, 0.91 to 1.22 m",
        (seed: number): number =>
          archetypeExtent(createRing({}, seed), "y", ["platform"]).high,
      ),
      row(
        "ring top rope",
        1.3,
        1.35,
        "the ring rules, 1.30 m",
        (seed: number): number =>
          archetypeExtent(createRing({}, seed), "y", ["northRope4"]).high -
          createRing({}, seed).dimensions.platform! -
          createRing.ROPE / 2,
      ),
      row(
        "skipping rope length",
        2.4,
        3,
        "makers' ropes",
        (seed: number): number =>
          archetypeExtent(createJumpRope({}, seed), "x").size,
      ),
      row(
        "sled handle height",
        0.95,
        1.2,
        "makers' sleds",
        (seed: number): number =>
          archetypeExtent(createSled({}, seed), "y", ["leftPole"]).high,
      ),
    ]),
  );
  TestValidator.equals("the gym additions are placed and sized", findings, []);
}
