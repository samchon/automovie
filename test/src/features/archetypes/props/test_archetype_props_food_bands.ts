import {
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  createFood,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../../internal/archetypeBandSweep";
import { archetypeExtent } from "../../internal/archetypeExtent";

/** USDA's apple portions. */
const APPLE: string = "USDA FoodData Central 171688 portions";

/** Two loaves: a 32 oz sandwich loaf and a 1 lb pan loaf. */
const BREAD: string = "Klosterman 32 oz loaf and the USA Pan 1 lb loaf";

/** USDA's drumstick. */
const DRUMSTICK: string = "USDA FoodData Central 172373, 130 g";

/** A drumstick's shape, a provisional estimate. */
const SHAPE: string = "the drumstick's provisional length and meat";

/**
 * Food stays inside its cited dimensions for every seed, measured on the produced thing, is bitten where its producer says, and a loaf tears in two halves.
 *
 * Scenarios:
 * 1. Over 200 seeds, inside the band and spanning at least 80 % of it: an apple 2 1/2 to 3 1/4 in across its colliders and as its grip's width, and 101 to 223 g; a loaf 8.5 to 14.75 in long, 4.25 to 4.5 in wide and 2.75 to 4.25 in high; a drumstick 130 g, 12 cm long with its meat 4.5 cm across, the shape provisional.
 * 2. For three seeds, a loaf's and a drumstick's `bite` is its `-X` end and an apple's its `+Z` side, each `+Y` out of the food.
 * 3. A drumstick's length and meat bands are marked provisional and its mass band is not; its `grip` lies on its knuckle at the `+X` end, along `X`, as wide as the knuckle.
 * 4. For three seeds, a loaf is two halves of half its length meeting at its middle; `hold` is over the `-X` half and `tear` over the `+X` half; at the tear's full travel the `+X` half alone has moved that far along `+X`, and the `-X` half and the `bite` stay where they were.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces each food for 200 seeds and measures colliders, contact frames and masses, reads the bite and grip frames, and articulates the loaf's tear; a band other than the citation's, a seed that does not vary it, a bite off the food's surface, a grip off the knuckle, an unmarked estimate, or a tear that moves the wrong half or the wrong way is caught.
 * @evidence contracts/development/testing.md#independent-expectations The apple's sizes and masses are USDA FoodData Central 171688's portions; the loaf's the Klosterman 32 oz loaf's 14.75 by 4.25 by 4.25 in and 32 oz and the 1 lb pan loaf's 8.5 by 4.5 by 2.75 in; the drumstick's mass USDA FoodData Central 172373's 130 g and its 12 by 4.5 cm shape the stated estimate; a bite's `+Y` out of the food is the working-point convention of `IAutoMovieAffordance.direction`, and a slider travels along its frame's `+X` by `AutoMovieAffordanceKind`.
 * @evidence contracts/development/testing.md#distinguishing-cases Each kind's sourced dimensions; an end against a side; a read band against an estimate; the moving half against the held one.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios and what each pins.
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
      2.5 * AutoMovieArchetypeUnits.INCH,
      3.25 * AutoMovieArchetypeUnits.INCH,
      APPLE,
      (seed: number): number =>
        archetypeExtent(createFood({ kind: "apple" }, seed), "x").size,
    ),
    row(
      "apple grip",
      2.5 * AutoMovieArchetypeUnits.INCH,
      3.25 * AutoMovieArchetypeUnits.INCH,
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
      8.5 * AutoMovieArchetypeUnits.INCH,
      14.75 * AutoMovieArchetypeUnits.INCH,
      BREAD,
      (seed: number): number =>
        archetypeExtent(createFood({ kind: "bread" }, seed), "x").size,
    ),
    row(
      "loaf width",
      4.25 * AutoMovieArchetypeUnits.INCH,
      4.5 * AutoMovieArchetypeUnits.INCH,
      BREAD,
      (seed: number): number =>
        archetypeExtent(createFood({ kind: "bread" }, seed), "z").size,
    ),
    row(
      "loaf height",
      2.75 * AutoMovieArchetypeUnits.INCH,
      4.25 * AutoMovieArchetypeUnits.INCH,
      BREAD,
      (seed: number): number =>
        archetypeExtent(createFood({ kind: "bread" }, seed), "y").size,
    ),
    row(
      "loaf mass",
      AutoMovieArchetypeUnits.POUND,
      32 * AutoMovieArchetypeUnits.OUNCE,
      BREAD,
      (seed: number): number => createFood({ kind: "bread" }, seed).body.mass,
    ),
    row(
      "drumstick length",
      0.12,
      0.12,
      SHAPE,
      (seed: number): number =>
        archetypeExtent(createFood({ kind: "drumstick" }, seed), "x").size,
    ),
    row(
      "drumstick meat",
      0.045,
      0.045,
      SHAPE,
      (seed: number): number =>
        archetypeExtent(createFood({ kind: "drumstick" }, seed), "z", ["meat"])
          .size,
    ),
    row(
      "drumstick mass",
      0.13,
      0.13,
      DRUMSTICK,
      (seed: number): number =>
        createFood({ kind: "drumstick" }, seed).body.mass,
    ),
  ]);

  for (const seed of [0, 1, 2]) {
    // 2. The bites.
    const loaf: ReturnType<typeof createFood> = createFood(
      { kind: "bread" },
      seed,
    );
    const apple: ReturnType<typeof createFood> = createFood(
      { kind: "apple" },
      seed,
    );
    const drumstick: ReturnType<typeof createFood> = createFood(
      { kind: "drumstick" },
      seed,
    );
    for (const end of [loaf, drumstick]) {
      const bite: ReturnType<typeof end.affordance> = end.affordance("bite");
      if (
        Math.abs(bite.frame.translation.x - archetypeExtent(end, "x").low) >
          1e-9 ||
        Math.abs(AutoMovieArchetypeFrame.axis(bite.frame, "y").x + 1) > 1e-12
      )
        findings.push(`${end.name}@${seed}: the bite is off its -X end`);
    }
    const side: ReturnType<typeof apple.affordance> = apple.affordance("bite");
    if (
      Math.abs(side.frame.translation.z - archetypeExtent(apple, "z").high) >
        1e-9 ||
      Math.abs(AutoMovieArchetypeFrame.axis(side.frame, "y").z - 1) > 1e-12
    )
      findings.push(`apple@${seed}: the bite is off its +Z side`);

    // 3. The drumstick's grip on its knuckle.
    const grip: ReturnType<typeof drumstick.affordance> =
      drumstick.affordance("grip");
    const knuckle: ReturnType<typeof archetypeExtent> = archetypeExtent(
      drumstick,
      "x",
      ["knuckle"],
    );
    if (
      Math.abs(knuckle.high - archetypeExtent(drumstick, "x").high) > 1e-9 ||
      grip.frame.translation.x < knuckle.low ||
      grip.frame.translation.x > knuckle.high ||
      Math.abs(AutoMovieArchetypeFrame.axis(grip.frame, "x").x - 1) > 1e-12 ||
      Math.abs(
        grip.aperture! - archetypeExtent(drumstick, "y", ["knuckle"]).size,
      ) > 1e-9
    )
      findings.push(`drumstick@${seed}: the grip is off its knuckle`);

    // 4. The loaf's two halves and its tear.
    const length: number = archetypeExtent(loaf, "x").size;
    const half: ReturnType<typeof archetypeExtent> = archetypeExtent(
      loaf,
      "x",
      ["half"],
    );
    const torn: ReturnType<typeof archetypeExtent> = archetypeExtent(
      loaf,
      "x",
      ["torn"],
    );
    const hold: ReturnType<typeof loaf.affordance> = loaf.affordance("hold");
    const tear: ReturnType<typeof loaf.affordance> = loaf.affordance("tear");
    const travel: number = tear.travel!;
    const opened: ReturnType<typeof createFood> = loaf.articulate({
      tear: travel,
    });
    const moved: ReturnType<typeof archetypeExtent> = archetypeExtent(
      opened,
      "x",
      ["torn"],
    );
    const kept: ReturnType<typeof archetypeExtent> = archetypeExtent(
      opened,
      "x",
      ["half"],
    );
    if (
      Math.abs(half.size - length / 2) > 1e-9 ||
      Math.abs(torn.size - length / 2) > 1e-9 ||
      Math.abs(half.high) > 1e-9 ||
      Math.abs(torn.low) > 1e-9 ||
      hold.frame.translation.x < half.low ||
      hold.frame.translation.x > half.high ||
      tear.frame.translation.x < torn.low ||
      tear.frame.translation.x > torn.high
    )
      findings.push(`loaf@${seed}: the halves or their holds are off`);
    if (
      !(travel > 0) ||
      Math.abs(AutoMovieArchetypeFrame.axis(tear.frame, "x").x - 1) > 1e-12 ||
      Math.abs(moved.low - travel) > 1e-9 ||
      Math.abs(kept.low - half.low) > 1e-9 ||
      Math.abs(kept.high - half.high) > 1e-9 ||
      Math.abs(
        opened.affordance("bite").frame.translation.x -
          loaf.affordance("bite").frame.translation.x,
      ) > 1e-9
    )
      findings.push(`loaf@${seed}: the tear does not draw the +X half away`);
  }

  // 3. The drumstick's estimates marked, its read mass not, on the bands the produced drumstick records.
  const bands: Readonly<Partial<Record<string, { provisional?: boolean }>>> =
    createFood({ kind: "drumstick" }, 0).provenance.bands;
  if (
    bands.length!.provisional !== true ||
    bands.diameter!.provisional !== true ||
    bands.mass!.provisional === true
  )
    findings.push("drumstick: its estimates or its read mass are mismarked");
  TestValidator.equals("food stays in its cited bands", findings, []);
}
