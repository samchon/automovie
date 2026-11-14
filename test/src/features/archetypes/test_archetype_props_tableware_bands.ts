import {
  createDrinkware,
  createTableware,
  createTool,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/** IKEA's 365+ plates as their pages give them. */
const IKEA_365: string = "IKEA 365+ plate, side plate and serving plates";

/** IKEA's 365+ cup with saucer. */
const CUP: string = "IKEA 365+ cup with saucer 13 cl";

/**
 * Tableware stays inside its cited dimensions for every seed, measured on the produced thing where a hand, a plate or food meets it.
 *
 * Scenarios, each over 200 seeds, inside the band and spanning at least 80 % of it:
 * 1. A dinner plate is 27 cm across its colliders and its face 3 cm up; a side plate 20 cm across and its face 2 cm up.
 * 2. A platter is 27 to 36 cm long along `X` and 15 to 20 cm wide along `Z`, its face 3 cm up.
 * 3. A saucer is 14 cm across.
 * 4. A cup's lip stands 6 cm up, and its outer diameter, the `body` grip's width, holds 13 cl over the 6 cm with a 5 mm floor and a wall of 3 to 5 mm.
 * 5. A table knife is 21 cm from its butt to its blade's tip, and its handle lies in the 6 to 13 mm precision handle band.
 * 6. A plate's two rim pinches are the rim's own width in from its two edges along `X`, on the face's slab, whatever the seed: their distance apart is the plate's measured diameter less one rim width.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces each plate, cup and knife for 200 seeds and measures colliders, contact frames and grip widths; a band other than the citation's, a plate drawn at another size than its band, a seed that does not vary it, or a rim pinch off the plate's edge is caught.
 * @evidence contracts/development/testing.md#independent-expectations The values are written here from the makers' pages (IKEA 365+ plate 27 cm and 3 cm, side plate 20 cm and 2 cm, serving plates 27 by 15 and 36 by 20 cm, cup with saucer 13 cl, 6 cm, saucer 14 cm; IKEA DRAGON knife 21 cm) and NIOSH 2004-164's 6 to 13 mm; the cup's width is the 13 cl over the 6 cm worked here by hand.
 * @evidence contracts/development/testing.md#distinguishing-cases Every tableware kind, the cup and the table knife; masses from packed weights only bound a plate from above and are left to the producers' provisional marks; frames' orthonormality and grip widths against colliders belong to the contract tests, stacking to `test_archetype_props_stacking`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the six scenarios and what each pins.
 */
export function test_archetype_props_tableware_bands(): void {
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    source: string,
    measure: (seed: number) => number,
  ): archetypeBandSweep.IRow => ({ name, minimum, maximum, source, measure });

  // 4. 13 cl in a cylinder 55 mm deep is 54.9 mm across inside; a 3 to 5 mm wall each side.
  const inside: number = 2 * Math.sqrt(130e-6 / (Math.PI * 0.055));
  TestValidator.equals(
    "tableware stays in its cited bands",
    archetypeBandSweep([
      row(
        "plate diameter",
        0.27,
        0.27,
        IKEA_365,
        (seed: number): number =>
          archetypeExtent(createTableware({ kind: "plate" }, seed), "x").size,
      ),
      row(
        "plate face height",
        0.03,
        0.03,
        IKEA_365,
        (seed: number): number =>
          createTableware({ kind: "plate" }, seed).affordance("top").frame
            .translation.y,
      ),
      row(
        "side plate diameter",
        0.2,
        0.2,
        IKEA_365,
        (seed: number): number =>
          archetypeExtent(createTableware({ kind: "sidePlate" }, seed), "z")
            .size,
      ),
      row(
        "side plate face height",
        0.02,
        0.02,
        IKEA_365,
        (seed: number): number =>
          archetypeExtent(createTableware({ kind: "sidePlate" }, seed), "y")
            .high,
      ),
      row(
        "platter length",
        0.27,
        0.36,
        IKEA_365,
        (seed: number): number =>
          archetypeExtent(createTableware({ kind: "platter" }, seed), "x").size,
      ),
      row(
        "platter width",
        0.15,
        0.2,
        IKEA_365,
        (seed: number): number =>
          archetypeExtent(createTableware({ kind: "platter" }, seed), "z").size,
      ),
      row(
        "saucer diameter",
        0.14,
        0.14,
        CUP,
        (seed: number): number =>
          archetypeExtent(createTableware({ kind: "saucer" }, seed), "x", [
            "top",
          ]).size,
      ),
      row(
        "cup lip height",
        0.06,
        0.06,
        CUP,
        (seed: number): number =>
          createDrinkware({ kind: "cup" }, seed).affordance("lip").frame
            .translation.y,
      ),
      row(
        "cup outer diameter",
        inside + 0.006,
        inside + 0.01,
        `${CUP}, 13 cl over 6 cm less a 5 mm floor, walls of 3 to 5 mm`,
        (seed: number): number =>
          createDrinkware({ kind: "cup" }, seed).affordance("body").aperture!,
      ),
      row(
        "table knife length",
        0.21,
        0.21,
        "IKEA DRAGON knife 21 cm",
        (seed: number): number =>
          archetypeExtent(createTool({ kind: "tableKnife" }, seed), "y").size,
      ),
      row(
        "table knife handle",
        0.006,
        0.013,
        "NIOSH 2004-164 precision handle",
        (seed: number): number =>
          createTool({ kind: "tableKnife" }, seed).affordance("grip").aperture!,
      ),
      row(
        "plate rim pinches apart, less the plate's diameter",
        -createTableware.RIM,
        -createTableware.RIM,
        "the rim's width in from each edge",
        (seed: number): number => {
          const plate: ReturnType<typeof createTableware> = createTableware(
            { kind: "plate" },
            seed,
          );
          return (
            plate.affordance("leftRim").frame.translation.x -
            plate.affordance("rightRim").frame.translation.x -
            archetypeExtent(plate, "x").size
          );
        },
      ),
    ]),
    [],
  );
}
