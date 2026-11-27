import { AutoMovieArchetypeBand, AutoMovieArchetypeUnits, type IAutoMovieArchetypeBand, } from "../core";
import type { AutoMovieArchetypeStreetFixture } from "./AutoMovieArchetypeStreetFixture";
/** The cone heights read. */
const MUTCD: string = "2009 MUTCD Section 6F.64: cones not less than 18 in high for daytime and low-speed roadways, at least 28 in on freeways and other high-speed highways or at night (https://mutcd.fhwa.dot.gov/htm/2009/part6/part6f.htm)";
/** The cone read. */
const BRIMAR: string = "Brimar 28 in traffic cone sheet: cone top 2.1 in, conical bottom width 9.8 in, base 13.4 x 13.4 in, 7 lb (https://www.safetysign.com/docs/Brimar_Traffic%20Cone%2028in7lbs.pdf)";
/** The pipe bollards read. */
const BOLLARD: string = "Reliance Foundry R-1040-S10 bollard drawing: 36 in above grade (https://www.reliance-foundry.com/wp-content/uploads/r-1040-s10-bollard-product-drawing.pdf); R-1007-04, -06, -08 and -10 steel pipe bollards of 4.50, 6.625, 8.625 and 10.750 in diameter weighing 76, 133, 200 and 284 lb (https://www.reliance-foundry.com/wp-content/uploads/r-1007-xx-bollard-product-drawing.pdf)";
/** The hydrant read. */
const MUELLER: string = "Mueller Centurion A-403 submittal drawing FH-10018 rev C: 32 in from the ground line to the top, the nozzles' centreline 24 in up, a 4 1/2 in pumper and two 2 1/2 in hose nozzles, a 1 1/2 in pentagon operating nut, 8.66 in across the top (https://www.muellercompany.com/sites/muellercompany.com/files/uploads/media/fh-10018_rev-c.pdf); the nozzles on one plane, the hose nozzles 180 degrees apart with the pumper between (Mueller MC124 2.5)";
/** The hydrant whose nozzle faces were read. */
const DARLING: string = "AMERICAN-Darling B-84-B-5 standard dimensions drawing: 30.50 in from the ground line to the top, the nozzles' centreline 18.00 in up, the pumper nozzle's face 8.84 in and the hose nozzles' faces 8.48 in from the hydrant's axis (https://american-usa.atl1.cdn.digitaloceanspaces.com/posts/2.4.1.1.2-b84b-standard-dimensions_print.png)";
/** The lamp post read. */
const WAVE: string = "Wave Lighting 3692 pole sheet: 12 ft mounting height, 3 in butt and 2.95 in top diameter, base 9 1/4 in across and 11 7/8 in high (https://cdn.shopify.com/s/files/1/1916/1697/files/wave-lighting-3600-pdf-4.pdf)";
/** The luminaire read. */
const STERNBERG: string = "Sternberg 1521LEDPT Omega post-top luminaire sheet: 21 in outside diameter and 40 in overall height (https://cdn.shopify.com/s/files/1/1916/1697/files/sternberg-lighting-1527led-medium-omega-pdf-1.pdf)";
/** The sign mounting and sizes read. */
const SIGN: string = "2009 MUTCD 2A.18: the sign's bottom 7 ft above the ground in business, commercial or residential areas (https://mutcd.fhwa.dot.gov/htm/2009/part2/part2a.htm); Table 2B-1: STOP R1-1 30 x 30 in on single-lane and 36 x 36 in on multi-lane conventional roads (https://mutcd.fhwa.dot.gov/htm/2009/part2/part2b.htm)";
/** The sign post read. */
const POST: string = "Atkore Telespar Qwik Punch square sign post: 2 x 2 in outside, 14 gauge (https://dam.atkore.com/api/public/content/ATCM-SSTelespar-Qwik-Punch-ATC-L-1609-1-1-22-WEB)";
/**
 * The band of each free dimension of {@link AutoMovieArchetypeStreetFixture}, by kind, but
 * those its models fix.
 */
export const STREET_FIXTURE_BANDS: Readonly<Record<AutoMovieArchetypeStreetFixture.Kind, Readonly<Partial<Record<AutoMovieArchetypeStreetFixture.Dimension, IAutoMovieArchetypeBand>>>>> = {
    trafficCone: {
        mass: AutoMovieArchetypeBand.of("kg", 1.5, 7 * AutoMovieArchetypeUnits.POUND, `${AutoMovieArchetypeBand.TYPICAL_MASS}; the Brimar 28 in cone weighs 7 lb; heights by ${MUTCD}, each cone in the proportions of ${BRIMAR}`, true),
    },
    bollard: {
        height: AutoMovieArchetypeBand.metres(36 * AutoMovieArchetypeUnits.INCH, 36 * AutoMovieArchetypeUnits.INCH, BOLLARD),
    },
    hydrant: {
        height: AutoMovieArchetypeBand.metres(30.5 * AutoMovieArchetypeUnits.INCH, 30.5 * AutoMovieArchetypeUnits.INCH, DARLING),
        nozzleHeight: AutoMovieArchetypeBand.metres(18 * AutoMovieArchetypeUnits.INCH, 18 * AutoMovieArchetypeUnits.INCH, DARLING),
        pumperReach: AutoMovieArchetypeBand.metres(8.84 * AutoMovieArchetypeUnits.INCH, 8.84 * AutoMovieArchetypeUnits.INCH, DARLING),
        hoseReach: AutoMovieArchetypeBand.metres(8.48 * AutoMovieArchetypeUnits.INCH, 8.48 * AutoMovieArchetypeUnits.INCH, DARLING),
        diameter: AutoMovieArchetypeBand.metres(8.66 * AutoMovieArchetypeUnits.INCH, 8.66 * AutoMovieArchetypeUnits.INCH, `${MUELLER}: the 8.66 in is unlabelled and taken as the barrel's`, true),
        mass: AutoMovieArchetypeBand.of("kg", 90, 150, AutoMovieArchetypeBand.TYPICAL_MASS, true),
    },
    lampPost: {
        height: AutoMovieArchetypeBand.metres(12 * AutoMovieArchetypeUnits.FOOT, 12 * AutoMovieArchetypeUnits.FOOT, WAVE),
        diameter: AutoMovieArchetypeBand.metres(3 * AutoMovieArchetypeUnits.INCH, 3 * AutoMovieArchetypeUnits.INCH, `${WAVE}: the butt`),
        base: AutoMovieArchetypeBand.metres((9 + 1 / 4) * AutoMovieArchetypeUnits.INCH, (9 + 1 / 4) * AutoMovieArchetypeUnits.INCH, WAVE),
        baseHeight: AutoMovieArchetypeBand.metres((11 + 7 / 8) * AutoMovieArchetypeUnits.INCH, (11 + 7 / 8) * AutoMovieArchetypeUnits.INCH, `${WAVE}: the 11 7/8 in is unlabelled and taken as the base's`, true),
        head: AutoMovieArchetypeBand.metres(21 * AutoMovieArchetypeUnits.INCH, 21 * AutoMovieArchetypeUnits.INCH, STERNBERG),
        headHeight: AutoMovieArchetypeBand.metres(40 * AutoMovieArchetypeUnits.INCH, 40 * AutoMovieArchetypeUnits.INCH, STERNBERG),
        mass: AutoMovieArchetypeBand.of("kg", 20, 40, AutoMovieArchetypeBand.TYPICAL_MASS, true),
    },
    signPost: {
        height: AutoMovieArchetypeBand.metres(7 * AutoMovieArchetypeUnits.FOOT, 7 * AutoMovieArchetypeUnits.FOOT, SIGN),
        diameter: AutoMovieArchetypeBand.metres(2 * AutoMovieArchetypeUnits.INCH, 2 * AutoMovieArchetypeUnits.INCH, POST),
        mass: AutoMovieArchetypeBand.of("kg", 8, 15, AutoMovieArchetypeBand.TYPICAL_MASS, true),
    },
};
