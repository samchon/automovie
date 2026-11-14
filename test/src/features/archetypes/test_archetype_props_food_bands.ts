import { createFood } from "@automovie/archetypes";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";
import { vclose } from "../internal/predicates";

/** USDA's apple portions. */
const APPLE: string = "USDA FoodData Central 171688 portions";

/** Two loaves: a 32 oz sandwich loaf and a 1 lb pan loaf. */
const BREAD: string = "Klosterman 32 oz loaf and the USA Pan 1 lb loaf";

/**
 * Food stays inside its cited dimensions for every seed, measured on the produced thing, and a loaf tears by its slider with its bite on the torn half.
 *
 * Scenarios:
 * 1. Over 200 seeds, inside the band and spanning at least 80 % of it: an apple 2 1/2 to 3 1/4 in across its colliders and as its grip's width, and 101 to 223 g; a loaf 8.5 to 14.75 in long, 4.25 to 4.5 in wide and 2.75 to 4.25 in high.
 * 2. A loaf torn by its whole travel moves its `-X` half and its `bite` by that travel along `-X`, and leaves its `+X` half and its `grip` where they were.
 * 3. A loaf at rest has its two halves meeting at its middle: the halves together are the loaf's measured length.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces each food for 200 seeds and measures colliders, contact frames and masses, then tears a loaf and reads its parts and contacts; a band other than the citation's, a seed that does not vary it, or a tear that moves the wrong half or leaves the bite behind is caught.
 * @evidence contracts/development/testing.md#independent-expectations The apple's sizes and masses are USDA FoodData Central 171688's portions; the loaf's the Klosterman 32 oz loaf's 14.75 by 4.25 by 4.25 in and 32 oz and the 1 lb pan loaf's 8.5 by 4.5 by 2.75 in; the tear's movement is the slider convention of `AutoMovieAffordanceKind`.
 * @evidence contracts/development/testing.md#distinguishing-cases Each kind's sourced dimensions; the moved half against the kept one.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios and what each pins.
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

  // 2. and 3. A loaf torn by its whole travel.
  for (const seed of [0, 1, 2]) {
    const loaf: ReturnType<typeof createFood> = createFood(
      { kind: "bread" },
      seed,
    );
    const travel: number = loaf.affordance("tear").travel!;
    const torn: ReturnType<typeof createFood> = loaf.articulate({
      tear: travel,
    });
    const moved = (id: "bite" | "grip"): IAutoMovieVector3 => {
      const from: IAutoMovieVector3 = loaf.affordance(id).frame.translation;
      const to: IAutoMovieVector3 = torn.affordance(id).frame.translation;
      return { x: to.x - from.x, y: to.y - from.y, z: to.z - from.z };
    };
    if (!vclose(moved("bite"), { x: -travel, y: 0, z: 0 }, 1e-9))
      findings.push(`loaf@${seed}: the bite moved ${JSON.stringify(moved("bite"))}`);
    if (!vclose(moved("grip"), { x: 0, y: 0, z: 0 }, 1e-9))
      findings.push(`loaf@${seed}: the grip moved ${JSON.stringify(moved("grip"))}`);
    const halves: number =
      archetypeExtent(loaf, "x", ["kept"]).size +
      archetypeExtent(loaf, "x", ["torn"]).size;
    if (Math.abs(halves - archetypeExtent(loaf, "x").size) > 1e-9)
      findings.push(`loaf@${seed}: halves of ${halves} m make the loaf`);
    if (
      Math.abs(
        archetypeExtent(torn, "x", ["torn"]).low -
          archetypeExtent(loaf, "x", ["torn"]).low +
          travel,
      ) > 1e-9 ||
      Math.abs(
        archetypeExtent(torn, "x", ["kept"]).low -
          archetypeExtent(loaf, "x", ["kept"]).low,
      ) > 1e-9
    )
      findings.push(`loaf@${seed}: the tear did not move the torn half alone`);
  }

  TestValidator.equals("food stays in its cited bands", findings, []);
}
