import { createTableware } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../../internal/archetypeBandSweep";
import { archetypeExtent } from "../../internal/archetypeExtent";

/** IKEA's 365+ plates as their pages give them. */
const IKEA_365: string = "IKEA 365+ side plate, plate and serving plates";

/** The platters read: IKEA's 27 by 15 by 3 cm, Rosenthal's Heritage Midas 33.20 by 21.20 by 3.80 cm, Thomas's Loft 33.80 by 24.00 by 3.10 cm. */
const PLATTERS: string =
  "IKEA 365+ serving plate, Rosenthal Heritage Midas and Thomas Loft platters";

/**
 * Tableware stays inside its cited dimensions for every seed, measured on the produced thing where a hand, a plate or food meets it.
 *
 * Scenarios:
 * 1. Over 200 seeds, inside the band and spanning at least 80 % of it: a round plate 20 to 27 cm across its colliders and 2 to 3 cm high at its face; a platter 27 to 33.8 cm long along `X`, 15 to 24 cm wide along `Z`, its face 3 to 3.8 cm up, over IKEA's, Rosenthal's and Thomas's platters; a saucer 12 cm across and 1.4 cm high.
 * 2. A plate's two rim pinches are on its two edges along `X`, the plate's measured diameter apart, and their aperture is the plate's measured height.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces each plate for 200 seeds and measures colliders, contact frames and grip widths; a band other than the citation's, a plate drawn at another size than its band, a seed that does not vary it, or a pinch off the plate's edge is caught.
 * @evidence contracts/development/testing.md#independent-expectations The values are written here from IKEA's pages: the 365+ side plate's 20 cm and 2 cm, the plate's 27 cm and 3 cm, the 27 by 15 cm serving plate, the 36 by 20 cm one stating no height; Rosenthal's Sonetto saucer's 12 cm and 1.4 cm.
 * @evidence contracts/development/testing.md#distinguishing-cases Both kinds; masses from packed weights only bound a plate from above and are left to the producer's provisional marks; frames' orthonormality and grip widths against colliders belong to the contract tests, stacking to `test_archetype_props_stacking`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the two scenarios and what each pins.
 */
export function test_archetype_props_tableware_bands(): void {
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    source: string,
    measure: (seed: number) => number,
  ): archetypeBandSweep.IRow => ({ name, minimum, maximum, source, measure });
  const findings: string[] = archetypeBandSweep([
    row(
      "plate diameter",
      0.2,
      0.27,
      IKEA_365,
      (seed: number): number =>
        archetypeExtent(createTableware({ kind: "plate" }, seed), "x").size,
    ),
    row(
      "plate face height",
      0.02,
      0.03,
      IKEA_365,
      (seed: number): number =>
        createTableware({ kind: "plate" }, seed).affordance("top").frame
          .translation.y,
    ),
    row(
      "platter length",
      0.27,
      0.338,
      PLATTERS,
      (seed: number): number =>
        archetypeExtent(createTableware({ kind: "platter" }, seed), "x").size,
    ),
    row(
      "platter width",
      0.15,
      0.24,
      PLATTERS,
      (seed: number): number =>
        archetypeExtent(createTableware({ kind: "platter" }, seed), "z").size,
    ),
    row(
      "platter face height",
      0.03,
      0.038,
      PLATTERS,
      (seed: number): number =>
        archetypeExtent(createTableware({ kind: "platter" }, seed), "y").high,
    ),
    row(
      "saucer diameter",
      0.12,
      0.12,
      "Rosenthal Sonetto saucer",
      (seed: number): number =>
        archetypeExtent(createTableware({ kind: "saucer" }, seed), "x").size,
    ),
    row(
      "saucer height",
      0.014,
      0.014,
      "Rosenthal Sonetto saucer",
      (seed: number): number =>
        archetypeExtent(createTableware({ kind: "saucer" }, seed), "y").size,
    ),
  ]);
  for (const seed of [0, 1, 2]) {
    const plate: ReturnType<typeof createTableware> = createTableware(
      { kind: "plate" },
      seed,
    );
    const left: ReturnType<typeof plate.affordance> =
      plate.affordance("leftRim");
    const right: ReturnType<typeof plate.affordance> =
      plate.affordance("rightRim");
    if (
      Math.abs(
        left.frame.translation.x -
          right.frame.translation.x -
          archetypeExtent(plate, "x").size,
      ) > 1e-9 ||
      Math.abs(left.aperture! - archetypeExtent(plate, "y").size) > 1e-9
    )
      findings.push(`plate@${seed}: the rim pinches are off its edges`);
  }
  TestValidator.equals("tableware stays in its cited bands", findings, []);
}
