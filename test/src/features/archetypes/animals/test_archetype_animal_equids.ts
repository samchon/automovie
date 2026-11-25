import {
  AutoMovieArchetypeRefusal,
  createQuadruped,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../internal/archetypeExtent";
import { archetypeModelSweep } from "../../internal/archetypeModelSweep";

/** The Veracruz donkeys of López-Yáñez et al. 2025: the least and greatest height, and the mean height and thoracic perimeter, centimetres. */
const VERACRUZ: Readonly<{
  low: number;
  high: number;
  height: number;
  girth: number;
}> = {
  low: 93,
  high: 127,
  height: 112.62,
  girth: 121.2,
};

/** The American Mammoth Jackstock's and the Thoroughbred's withers height and fore cannon in Brooks et al. 2010's published rows, as this campaign averaged them, centimetres. */
const CANNONS: Readonly<{
  jackstock: readonly [number, number];
  thoroughbred: readonly [number, number];
}> = {
  jackstock: [151.1, 31.2],
  thoroughbred: [161.4, 32.9],
};

/** Kubo et al. 1992's thoroughbred metacarpus over its 1.62 m withers height. */
const KUBO: number = 0.28 / 1.62;

/** Jensen et al. 2019, Acta Vet Scand 61, Table 2: 38 weighed adult warmbloods' means, withers 172 cm, heart girth 204 cm, body weight 640 kg; metres and kilograms. */
const JENSEN: Readonly<{ withers: number; girth: number; mass: number }> = {
  withers: 1.72,
  girth: 2.04,
  mass: 640,
};

/**
 * A donkey's three measures follow its one drawn height, and a mule is one sex's weighed mean whole.
 *
 * Scenarios, over 200 seeds:
 * 1. A mule's withers, barrel round and mass are the female's or the male's means of Velásquez Mosquera et al. 2020's 94 weighed mules (130.40 and 135.28 cm, 147.85 and 152.58 cm, 275.36 and 298.88 kg), and both appear (`archetypeModelSweep`).
 * 2. A donkey's withers stand inside the Veracruz donkeys' 93 to 127 cm, both ends' halves are reached, its barrel's round is its height in the sample's 121.2 to 112.62 cm proportion, and its mass is the girth-squared-times-length law's on the two, anchored on Jensen et al. 2019's weighed warmbloods.
 * 3. A donkey's fore cannon over its height is Kubo's thoroughbred fraction scaled by the jackstock's cannon over its height against the Thoroughbred's.
 * 4. Fixing a mule's height at the withers, its sex's own figure, is refused at that dimension.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces each kind for 200 seeds and measures the withers' top, the barrel's width, a bone's length and the body's mass; a mule blended between sexes, a donkey whose girth or mass is drawn apart from its height, or a bone out of the jackstock's proportion is caught.
 * @evidence contracts/development/testing.md#independent-expectations The sexes' means, the donkeys' range and proportion, the jackstock's and the Thoroughbred's cannons and Kubo's fraction are written here from their sources; the law's anchor is Jensen et al.'s means, written here as numbers.
 * @evidence contracts/development/testing.md#distinguishing-cases Both sexes, the donkey's band from end to end, its girth, mass and one derived bone, and one refused figure.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios and what each pins.
 */
export function test_archetype_animal_equids(): void {
  const measured = (
    animal: ReturnType<typeof createQuadruped>,
  ): [number, number, number] => [
    archetypeExtent(animal, "y", ["withers"]).high,
    Math.PI * archetypeExtent(animal, "x", ["trunk"]).size,
    // The animal alone: its whole less its riding saddle's 5.4 kg, Wintec's stated weight for its 500 All Purpose.
    animal.body.mass - 5.4,
  ];
  TestValidator.equals(
    "a mule is one sex's weighed mean whole",
    archetypeModelSweep([
      {
        name: "mule",
        measure: (seed: number): number[] =>
          measured(createQuadruped({ kind: "mule" }, seed)),
        models: [
          [1.304, 1.4785, 275.36],
          [1.3528, 1.5258, 298.88],
        ],
        source: "Velásquez Mosquera et al. 2020, Table 1",
        tolerance: 1e-3,
      },
    ]),
    [],
  );

  const findings: string[] = [];
  const anchor: typeof JENSEN = JENSEN;
  const middle: number = (VERACRUZ.low + VERACRUZ.high) / 200;
  let low: boolean = false;
  let high: boolean = false;
  for (let seed: number = 0; seed < archetypeModelSweep.SEEDS; seed++) {
    const donkey: ReturnType<typeof createQuadruped> = createQuadruped(
      { kind: "donkey" },
      seed,
    );
    const [withers, round, mass]: [number, number, number] = measured(donkey);
    if (
      !(
        withers >= VERACRUZ.low / 100 - 1e-3 &&
        withers <= VERACRUZ.high / 100 + 1e-3
      )
    )
      findings.push(
        `seed ${seed}: a donkey's withers at ${withers} m lie outside the sample`,
      );
    low ||= withers < middle;
    high ||= withers > middle;
    const height: number = donkey.dimensions.withersHeight!;
    const girth: number = (height * VERACRUZ.girth) / VERACRUZ.height;
    if (Math.abs(round - girth) > 1e-3)
      findings.push(
        `seed ${seed}: a ${height} m donkey's barrel is ${round} m round, not ${girth}`,
      );
    const weight: number =
      anchor.mass * (girth / anchor.girth) ** 2 * (height / anchor.withers);
    if (Math.abs(mass - weight) > 1e-6 * weight)
      findings.push(
        `seed ${seed}: a ${height} m donkey weighs ${mass} kg, not ${weight}`,
      );
    const fraction: number =
      archetypeExtent(donkey, "y", ["rightForeCannon"]).size / withers;
    const expected: number =
      KUBO *
      (CANNONS.jackstock[1] /
        CANNONS.jackstock[0] /
        (CANNONS.thoroughbred[1] / CANNONS.thoroughbred[0]));
    if (Math.abs(fraction - expected) > 0.0005)
      findings.push(
        `seed ${seed}: a donkey's fore cannon is ${fraction} of its height, not ${expected}`,
      );
  }
  if (!(low && high))
    findings.push(
      "the donkeys do not reach both halves of the sample's heights",
    );

  let refused: unknown = null;
  try {
    createQuadruped({ kind: "mule", withersHeight: 1.3 }, 3);
  } catch (error) {
    refused = error;
  }
  if (
    !(
      refused instanceof AutoMovieArchetypeRefusal &&
      refused.axis === "withersHeight"
    )
  )
    findings.push(
      "a fixed height at the withers, a mule sex's own figure, is not refused",
    );
  TestValidator.equals("a donkey's measures follow its height", findings, []);
}
