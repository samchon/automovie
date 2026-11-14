import { ArchetypeBand, type IArchetypeBand } from "../core";
import type { createStreetFixture } from "./createStreetFixture";

/** The cone heights read. */
const MUTCD: string =
  "2009 MUTCD Section 6F.64: cones not less than 18 in high for daytime and low-speed roadways, at least 28 in on freeways and other high-speed highways or at night (https://mutcd.fhwa.dot.gov/htm/2009/part6/part6f.htm)";

/** The cone read. */
const BRIMAR: string =
  "Brimar 28 in traffic cone sheet: cone top 2.1 in, conical bottom width 9.8 in, base 13.4 x 13.4 in, 7 lb (https://www.safetysign.com/docs/Brimar_Traffic%20Cone%2028in7lbs.pdf)";

/** The pipe bollards read. */
const BOLLARD: string =
  "Reliance Foundry R-1040-S10 bollard drawing: 36 in above grade (https://www.reliance-foundry.com/wp-content/uploads/r-1040-s10-bollard-product-drawing.pdf); R-1007 steel pipe bollards of 4.50, 6.625, 8.625 and 10.750 in diameter, 76 to 284 lb (https://www.reliance-foundry.com/wp-content/uploads/r-1007-xx-bollard-product-drawing.pdf)";

/** The hydrant read. */
const MUELLER: string =
  "Mueller Centurion A-403 submittal drawing FH-10018 rev C: 32 in from the ground line to the top, the nozzles' centreline 24 in up, a 4 1/2 in pumper and two 2 1/2 in hose nozzles, a 1 1/2 in pentagon operating nut, 8.66 in across the top (https://www.muellercompany.com/sites/muellercompany.com/files/uploads/media/fh-10018_rev-c.pdf); the nozzles on one plane, the hose nozzles 180 degrees apart with the pumper between (Mueller MC124 2.5)";

/** The lamp post read. */
const WAVE: string =
  "Wave Lighting 3692 pole sheet: 12 ft mounting height, 3 in butt and 2.95 in top diameter, base 9 1/4 in across and 11 7/8 in high (https://cdn.shopify.com/s/files/1/1916/1697/files/wave-lighting-3600-pdf-4.pdf)";

/**
 * The band of each free dimension of {@link createStreetFixture}, by kind.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the table holds; each band names its source.
 * @evidence contracts/development/design.md#principled-representation One cited band per dimension per kind, keyed by the producer's closed unions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Kept beside the producer so the producer stays one readable construction; it re-exports as `createStreetFixture.BANDS`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A figure read off an unlabelled dimension is provisional and says so.
 */
export const STREET_FIXTURE_BANDS: Readonly<
  Record<
    createStreetFixture.Kind,
    Readonly<Partial<Record<createStreetFixture.Dimension, IArchetypeBand>>>
  >
> = {
  trafficCone: {
    height: ArchetypeBand.metres(
      0.4572,
      0.7112,
      `${MUTCD}; each cone drawn in the proportions of ${BRIMAR}`,
    ),
    mass: ArchetypeBand.of(
      "kg",
      1.5,
      3.2,
      `${ArchetypeBand.TYPICAL_MASS}; the Brimar 28 in cone weighs 7 lb (3.2 kg)`,
      true,
    ),
  },
  bollard: {
    height: ArchetypeBand.metres(0.9144, 0.9144, BOLLARD),
    diameter: ArchetypeBand.metres(0.1143, 0.2731, BOLLARD),
    mass: ArchetypeBand.of("kg", 34.5, 128.8, `${BOLLARD}: whole pipes`),
  },
  hydrant: {
    height: ArchetypeBand.metres(0.8128, 0.8128, MUELLER),
    nozzleHeight: ArchetypeBand.metres(0.6096, 0.6096, MUELLER),
    diameter: ArchetypeBand.metres(
      0.22,
      0.22,
      `${MUELLER}: the 8.66 in is unlabelled and taken as the barrel's`,
      true,
    ),
    mass: ArchetypeBand.of("kg", 90, 150, ArchetypeBand.TYPICAL_MASS, true),
  },
  lampPost: {
    height: ArchetypeBand.metres(3.6576, 3.6576, WAVE),
    diameter: ArchetypeBand.metres(0.0762, 0.0762, `${WAVE}: the butt`),
    base: ArchetypeBand.metres(0.235, 0.235, WAVE),
    baseHeight: ArchetypeBand.metres(
      0.3016,
      0.3016,
      `${WAVE}: the 11 7/8 in is unlabelled and taken as the base's`,
      true,
    ),
    mass: ArchetypeBand.of("kg", 20, 40, ArchetypeBand.TYPICAL_MASS, true),
  },
};
