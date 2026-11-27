import { AutoMovieArchetypeBand, AutoMovieArchetypeUnits, type IAutoMovieArchetypeBand, } from "../../core";
import type { AutoMovieArchetypeObstacle } from "../AutoMovieArchetypeObstacle";
import { ObstacleBandsData } from "./internal/ObstacleBandsData";
/*
 * The band of each free dimension of AutoMovieArchetypeObstacle, by kind.
 */
export const OBSTACLE_BANDS: Readonly<Record<AutoMovieArchetypeObstacle.Kind, Readonly<Partial<Record<AutoMovieArchetypeObstacle.Dimension, IAutoMovieArchetypeBand>>>>> = {
    crosstie: {
        mass: AutoMovieArchetypeBand.of("kg", 70, 110, `${AutoMovieArchetypeBand.TYPICAL_MASS}; its sizes by ${ObstacleBandsData.TIE}`, true),
    },
    sandbag: {
        length: AutoMovieArchetypeBand.metres(AutoMovieArchetypeUnits.FOOT, AutoMovieArchetypeUnits.FOOT, ObstacleBandsData.SANDBAG),
        height: AutoMovieArchetypeBand.metres(AutoMovieArchetypeUnits.FOOT / 3, AutoMovieArchetypeUnits.FOOT / 3, `${ObstacleBandsData.SANDBAG}: a third of a foot`),
        width: AutoMovieArchetypeBand.metres((2.5 * AutoMovieArchetypeUnits.FOOT) / 3, (2.5 * AutoMovieArchetypeUnits.FOOT) / 3, `${ObstacleBandsData.SANDBAG}: a third of 2-1/2 ft`),
        mass: AutoMovieArchetypeBand.of("kg", 35 * AutoMovieArchetypeUnits.POUND, 50 * AutoMovieArchetypeUnits.POUND, "filled sandbags of 35 to 50 lb, as search results give USACE district brochures; not read", true),
    },
    jerseyBarrier: {
        length: AutoMovieArchetypeBand.metres(3 * AutoMovieArchetypeUnits.FOOT, 30 * AutoMovieArchetypeUnits.FOOT, ObstacleBandsData.JERSEY),
        height: AutoMovieArchetypeBand.metres(32 * AutoMovieArchetypeUnits.INCH, 32 * AutoMovieArchetypeUnits.INCH, ObstacleBandsData.JERSEY),
        width: AutoMovieArchetypeBand.metres(24 * AutoMovieArchetypeUnits.INCH, 24 * AutoMovieArchetypeUnits.INCH, ObstacleBandsData.JERSEY),
        top: AutoMovieArchetypeBand.metres(6 * AutoMovieArchetypeUnits.INCH, 6 * AutoMovieArchetypeUnits.INCH, ObstacleBandsData.JERSEY),
        curb: AutoMovieArchetypeBand.metres(3 * AutoMovieArchetypeUnits.INCH, 3 * AutoMovieArchetypeUnits.INCH, ObstacleBandsData.JERSEY),
        lowerFace: AutoMovieArchetypeBand.metres(10 * AutoMovieArchetypeUnits.INCH, 10 * AutoMovieArchetypeUnits.INCH, ObstacleBandsData.JERSEY),
        massPerMetre: AutoMovieArchetypeBand.of("kg", (450 * AutoMovieArchetypeUnits.POUND) / AutoMovieArchetypeUnits.FOOT, (550 * AutoMovieArchetypeUnits.POUND) / AutoMovieArchetypeUnits.FOOT, `${ObstacleBandsData.JERSEY}, per metre`),
    },
    crowdBarrier: {
        length: AutoMovieArchetypeBand.metres(7.5 * AutoMovieArchetypeUnits.FOOT, 7.5 * AutoMovieArchetypeUnits.FOOT, ObstacleBandsData.CROWD, true),
        height: AutoMovieArchetypeBand.metres(43 * AutoMovieArchetypeUnits.INCH, 43 * AutoMovieArchetypeUnits.INCH, ObstacleBandsData.CROWD, true),
        tube: AutoMovieArchetypeBand.metres(1.5 * AutoMovieArchetypeUnits.INCH, 1.5 * AutoMovieArchetypeUnits.INCH, ObstacleBandsData.CROWD, true),
        spacing: AutoMovieArchetypeBand.metres(4 * AutoMovieArchetypeUnits.INCH, 4 * AutoMovieArchetypeUnits.INCH, ObstacleBandsData.CROWD, true),
        mass: AutoMovieArchetypeBand.of("kg", 23.5 * AutoMovieArchetypeUnits.POUND, 34 * AutoMovieArchetypeUnits.POUND, ObstacleBandsData.CROWD, true),
    },
    ropeAndPosts: {
        length: AutoMovieArchetypeBand.metres(6 * AutoMovieArchetypeUnits.FOOT, 6 * AutoMovieArchetypeUnits.FOOT, ObstacleBandsData.LAVI, true),
        height: AutoMovieArchetypeBand.metres(40 * AutoMovieArchetypeUnits.INCH, 40 * AutoMovieArchetypeUnits.INCH, ObstacleBandsData.LAVI, true),
        post: AutoMovieArchetypeBand.metres((2 + 3 / 4) * AutoMovieArchetypeUnits.INCH, (2 + 3 / 4) * AutoMovieArchetypeUnits.INCH, ObstacleBandsData.LAVI, true),
        base: AutoMovieArchetypeBand.metres((14 + 1 / 2) * AutoMovieArchetypeUnits.INCH, (14 + 1 / 2) * AutoMovieArchetypeUnits.INCH, ObstacleBandsData.LAVI, true),
        ropeDiameter: AutoMovieArchetypeBand.metres(1.5 * AutoMovieArchetypeUnits.INCH, 1.5 * AutoMovieArchetypeUnits.INCH, ObstacleBandsData.LAVI, true),
        mass: AutoMovieArchetypeBand.of("kg", 15, 25, AutoMovieArchetypeBand.TYPICAL_MASS, true),
    },
};
