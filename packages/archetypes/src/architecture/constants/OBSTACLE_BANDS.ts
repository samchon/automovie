import { AutoMovieArchetypeBand, AutoMovieArchetypeUnits, type IAutoMovieArchetypeBand, } from "../../core";
import type { AutoMovieArchetypeObstacle } from "../AutoMovieArchetypeObstacle";
/*
 * The crosstie read.
 */
const TIE: string = "University of Kentucky FOR-108, Producing and Inspecting Railroad Crossties: most commonly 7 x 9 in, some 6 x 8 and 7 x 8 in; 8 ft 6 in the most common length, 8 ft standard, 9 ft sometimes required (https://publications.mgcafe.uky.edu/sites/publications.ca.uky.edu/files/FOR108.pdf)";
/*
 * The sandbag read.
 */
const SANDBAG: string = "USACE Northwestern Division, Sandbagging Techniques (2004): bags about 14 x 24 in filled half to two-thirds; laid, one bag long is about 1 ft, three wide about 2-1/2 ft, three high about 1 ft (https://extension.usu.edu/post-wildfire/files/USACE-Sandbag-Pamphlet.pdf)";
/*
 * The concrete barrier read.
 */
const JERSEY: string = "FHWA-RD-89-036, Figure 1 and Introduction: the New Jersey portable concrete safety shaped barrier 32 in high with a 24 in base and a 6 in top, a 3 in curb and a 10 in lower face; 3 to 30 ft long at 450 to 550 lb per foot (https://www.fhwa.dot.gov/publications/research/safety/89036/89036.pdf)";
/*
 * The crowd barriers, from a search only.
 */
const CROWD: string = "steel crowd barriers of 43 in by 7.5 ft with a 1.5 in frame tube and 4 in bar spacing, 23.5 to 34 lb, as search results give BroadFence and Crowd Control Warehouse listings; not read";
/*
 * The stanchions, from a search only.
 */
const LAVI: string = "Lavi Industries stanchion posts 40 in high, 2-3/4 in post, 14-1/2 in base, and 6 ft velour ropes 1-1/2 in thick, as search results give reseller listings; not read";
/*
 * The band of each free dimension of AutoMovieArchetypeObstacle, by kind.
 */
export const OBSTACLE_BANDS: Readonly<Record<AutoMovieArchetypeObstacle.Kind, Readonly<Partial<Record<AutoMovieArchetypeObstacle.Dimension, IAutoMovieArchetypeBand>>>>> = {
    crosstie: {
        mass: AutoMovieArchetypeBand.of("kg", 70, 110, `${AutoMovieArchetypeBand.TYPICAL_MASS}; its sizes by ${TIE}`, true),
    },
    sandbag: {
        length: AutoMovieArchetypeBand.metres(AutoMovieArchetypeUnits.FOOT, AutoMovieArchetypeUnits.FOOT, SANDBAG),
        height: AutoMovieArchetypeBand.metres(AutoMovieArchetypeUnits.FOOT / 3, AutoMovieArchetypeUnits.FOOT / 3, `${SANDBAG}: a third of a foot`),
        width: AutoMovieArchetypeBand.metres((2.5 * AutoMovieArchetypeUnits.FOOT) / 3, (2.5 * AutoMovieArchetypeUnits.FOOT) / 3, `${SANDBAG}: a third of 2-1/2 ft`),
        mass: AutoMovieArchetypeBand.of("kg", 35 * AutoMovieArchetypeUnits.POUND, 50 * AutoMovieArchetypeUnits.POUND, "filled sandbags of 35 to 50 lb, as search results give USACE district brochures; not read", true),
    },
    jerseyBarrier: {
        length: AutoMovieArchetypeBand.metres(3 * AutoMovieArchetypeUnits.FOOT, 30 * AutoMovieArchetypeUnits.FOOT, JERSEY),
        height: AutoMovieArchetypeBand.metres(32 * AutoMovieArchetypeUnits.INCH, 32 * AutoMovieArchetypeUnits.INCH, JERSEY),
        width: AutoMovieArchetypeBand.metres(24 * AutoMovieArchetypeUnits.INCH, 24 * AutoMovieArchetypeUnits.INCH, JERSEY),
        top: AutoMovieArchetypeBand.metres(6 * AutoMovieArchetypeUnits.INCH, 6 * AutoMovieArchetypeUnits.INCH, JERSEY),
        curb: AutoMovieArchetypeBand.metres(3 * AutoMovieArchetypeUnits.INCH, 3 * AutoMovieArchetypeUnits.INCH, JERSEY),
        lowerFace: AutoMovieArchetypeBand.metres(10 * AutoMovieArchetypeUnits.INCH, 10 * AutoMovieArchetypeUnits.INCH, JERSEY),
        massPerMetre: AutoMovieArchetypeBand.of("kg", (450 * AutoMovieArchetypeUnits.POUND) / AutoMovieArchetypeUnits.FOOT, (550 * AutoMovieArchetypeUnits.POUND) / AutoMovieArchetypeUnits.FOOT, `${JERSEY}, per metre`),
    },
    crowdBarrier: {
        length: AutoMovieArchetypeBand.metres(7.5 * AutoMovieArchetypeUnits.FOOT, 7.5 * AutoMovieArchetypeUnits.FOOT, CROWD, true),
        height: AutoMovieArchetypeBand.metres(43 * AutoMovieArchetypeUnits.INCH, 43 * AutoMovieArchetypeUnits.INCH, CROWD, true),
        tube: AutoMovieArchetypeBand.metres(1.5 * AutoMovieArchetypeUnits.INCH, 1.5 * AutoMovieArchetypeUnits.INCH, CROWD, true),
        spacing: AutoMovieArchetypeBand.metres(4 * AutoMovieArchetypeUnits.INCH, 4 * AutoMovieArchetypeUnits.INCH, CROWD, true),
        mass: AutoMovieArchetypeBand.of("kg", 23.5 * AutoMovieArchetypeUnits.POUND, 34 * AutoMovieArchetypeUnits.POUND, CROWD, true),
    },
    ropeAndPosts: {
        length: AutoMovieArchetypeBand.metres(6 * AutoMovieArchetypeUnits.FOOT, 6 * AutoMovieArchetypeUnits.FOOT, LAVI, true),
        height: AutoMovieArchetypeBand.metres(40 * AutoMovieArchetypeUnits.INCH, 40 * AutoMovieArchetypeUnits.INCH, LAVI, true),
        post: AutoMovieArchetypeBand.metres((2 + 3 / 4) * AutoMovieArchetypeUnits.INCH, (2 + 3 / 4) * AutoMovieArchetypeUnits.INCH, LAVI, true),
        base: AutoMovieArchetypeBand.metres((14 + 1 / 2) * AutoMovieArchetypeUnits.INCH, (14 + 1 / 2) * AutoMovieArchetypeUnits.INCH, LAVI, true),
        ropeDiameter: AutoMovieArchetypeBand.metres(1.5 * AutoMovieArchetypeUnits.INCH, 1.5 * AutoMovieArchetypeUnits.INCH, LAVI, true),
        mass: AutoMovieArchetypeBand.of("kg", 15, 25, AutoMovieArchetypeBand.TYPICAL_MASS, true),
    },
};
