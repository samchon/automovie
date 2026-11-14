import { ArchetypeFrame, createFood } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/** USDA's apple portions. */
const APPLE: string = "USDA FoodData Central 171688 portions";

/** Two loaves: a 32 oz sandwich loaf and a 1 lb pan loaf. */
const BREAD: string = "Klosterman 32 oz loaf and the USA Pan 1 lb loaf";

/**
 * Food stays inside its cited dimensions for every seed, measured on the produced thing, and is bitten where its producer says.
 *
 * Scenarios:
 * 1. Over 200 seeds, inside the band and spanning at least 80 % of it: an apple 2 1/2 to 3 1/4 in across its colliders and as its grip's width, and 101 to 223 g; a loaf 8.5 to 14.75 in long, 4.25 to 4.5 in wide and 2.75 to 4.25 in high.
 * 2. For three seeds, a loaf's `bite` is its `-X` end and an apple's its `+Z` side, each `+Y` out of the food.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces each food for 200 seeds and measures colliders, contact frames and masses, then reads the bite frames; a band other than the citation's, a seed that does not vary it, or a bite off the food's surface is caught.
 * @evidence contracts/development/testing.md#independent-expectations The apple's sizes and masses are USDA FoodData Central 171688's portions; the loaf's the Klosterman 32 oz loaf's 14.75 by 4.25 by 4.25 in and 32 oz and the 1 lb pan loaf's 8.5 by 4.5 by 2.75 in; a bite's `+Y` out of the food is the working-point convention of `IAutoMovieAffordance.direction`.
 * @evidence contracts/development/testing.md#distinguishing-cases Each kind's sourced dimensions; an end against a side.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the two scenarios and what each pins.
 */
export function test_archetype_props_food_bands(): void {
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    source: string,
    measure: (seed: number) => number,
  ): archetypeBandSweep.IRow => ({ name, minimum, maximum, source, measure });
  const findings: string[] = archetypeBandSweep([
    row(
      "apple diameter",
      2.5 * 0.0254,
      3.25 * 0.0254,
      APPLE,
      (seed: number): number =>
        archetypeExtent(createFood({ kind: "apple" }, seed), "x").size,
    ),
    row(
      "apple grip",
      2.5 * 0.0254,
      3.25 * 0.0254,
      APPLE,
      (seed: number): number =>
        createFood({ kind: "apple" }, seed).affordance("grip").aperture!,
    ),
    row(
      "apple mass",
      0.101,
      0.223,
      APPLE,
      (seed: number): number => createFood({ kind: "apple" }, seed).body.mass,
    ),
    row(
      "loaf length",
      8.5 * 0.0254,
      14.75 * 0.0254,
      BREAD,
      (seed: number): number =>
        archetypeExtent(createFood({ kind: "bread" }, seed), "x").size,
    ),
    row(
      "loaf width",
      4.25 * 0.0254,
      4.5 * 0.0254,
      BREAD,
      (seed: number): number =>
        archetypeExtent(createFood({ kind: "bread" }, seed), "z").size,
    ),
    row(
      "loaf height",
      2.75 * 0.0254,
      4.25 * 0.0254,
      BREAD,
      (seed: number): number =>
        archetypeExtent(createFood({ kind: "bread" }, seed), "y").size,
    ),
  ]);


  for (const seed of [0, 1, 2]) {
    const loaf: ReturnType<typeof createFood> = createFood(
      { kind: "bread" },
      seed,
    );
    const apple: ReturnType<typeof createFood> = createFood(
      { kind: "apple" },
      seed,
    );
    const end: ReturnType<typeof loaf.affordance> = loaf.affordance("bite");
    const side: ReturnType<typeof apple.affordance> = apple.affordance("bite");
    if (
      Math.abs(end.frame.translation.x - archetypeExtent(loaf, "x").low) >
        1e-9 ||
      Math.abs(ArchetypeFrame.axis(end.frame, "y").x + 1) > 1e-12 ||
      Math.abs(side.frame.translation.z - archetypeExtent(apple, "z").high) >
        1e-9 ||
      Math.abs(ArchetypeFrame.axis(side.frame, "y").z - 1) > 1e-12
    )
      findings.push(`food@${seed}: a bite is off its food`);
  }
  TestValidator.equals("food stays in its cited bands", findings, []);
}
