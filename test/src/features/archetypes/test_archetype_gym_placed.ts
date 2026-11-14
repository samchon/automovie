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
 * 2. Over 200 seeds: the rowing machine's seat top 14 to 20 in high (Concept2's standard and tall legs); the ring's canvas 1 m high and its top rope 1.3 m above it (the AIBA guide); the skipping rope's cable 120 to 132 in long (Rogue's); the sled's handles 37.25 to 37.5 in high (Rogue's).
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
        14 * 0.0254,
        20 * 0.0254,
        "Concept2, 14 and 20 in seats",
        (seed: number): number =>
          archetypeExtent(createRowingMachine({}, seed), "y", ["seat"]).high,
      ),
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
      row(
        "skipping rope length",
        120 * 0.0254,
        132 * 0.0254,
        "Rogue SR-1, 120 in to 11 ft cables",
        (seed: number): number =>
          archetypeExtent(createJumpRope({}, seed), "x", ["cord"]).size,
      ),
      row(
        "sled handle height",
        37.25 * 0.0254,
        37.5 * 0.0254,
        "Rogue's sleds, 37.25 and 37.5 in",
        (seed: number): number =>
          archetypeExtent(createSled({}, seed), "y", ["leftPole"]).high,
      ),
    ]),
  );
  TestValidator.equals("the gym additions are placed and sized", findings, []);
}
