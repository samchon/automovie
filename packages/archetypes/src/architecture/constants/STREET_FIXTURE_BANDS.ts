import { AutoMovieArchetypeBand, AutoMovieArchetypeUnits, type IAutoMovieArchetypeBand, } from "../../core";
import type { AutoMovieArchetypeStreetFixture } from "../AutoMovieArchetypeStreetFixture";
import { StreetFixtureBandsData } from "./internal/StreetFixtureBandsData";
/*
 * The band of each free dimension of AutoMovieArchetypeStreetFixture, by kind, but
 * those its models fix.
 */
export const STREET_FIXTURE_BANDS: Readonly<Record<AutoMovieArchetypeStreetFixture.Kind, Readonly<Partial<Record<AutoMovieArchetypeStreetFixture.Dimension, IAutoMovieArchetypeBand>>>>> = {
    trafficCone: {
        mass: AutoMovieArchetypeBand.of("kg", 1.5, 7 * AutoMovieArchetypeUnits.POUND, `${AutoMovieArchetypeBand.TYPICAL_MASS}; the Brimar 28 in cone weighs 7 lb; heights by ${StreetFixtureBandsData.MUTCD}, each cone in the proportions of ${StreetFixtureBandsData.BRIMAR}`, true),
    },
    bollard: {
        height: AutoMovieArchetypeBand.metres(36 * AutoMovieArchetypeUnits.INCH, 36 * AutoMovieArchetypeUnits.INCH, StreetFixtureBandsData.BOLLARD),
    },
    hydrant: {
        height: AutoMovieArchetypeBand.metres(30.5 * AutoMovieArchetypeUnits.INCH, 30.5 * AutoMovieArchetypeUnits.INCH, StreetFixtureBandsData.DARLING),
        nozzleHeight: AutoMovieArchetypeBand.metres(18 * AutoMovieArchetypeUnits.INCH, 18 * AutoMovieArchetypeUnits.INCH, StreetFixtureBandsData.DARLING),
        pumperReach: AutoMovieArchetypeBand.metres(8.84 * AutoMovieArchetypeUnits.INCH, 8.84 * AutoMovieArchetypeUnits.INCH, StreetFixtureBandsData.DARLING),
        hoseReach: AutoMovieArchetypeBand.metres(8.48 * AutoMovieArchetypeUnits.INCH, 8.48 * AutoMovieArchetypeUnits.INCH, StreetFixtureBandsData.DARLING),
        diameter: AutoMovieArchetypeBand.metres(8.66 * AutoMovieArchetypeUnits.INCH, 8.66 * AutoMovieArchetypeUnits.INCH, `${StreetFixtureBandsData.MUELLER}: the 8.66 in is unlabelled and taken as the barrel's`, true),
        mass: AutoMovieArchetypeBand.of("kg", 90, 150, AutoMovieArchetypeBand.TYPICAL_MASS, true),
    },
    lampPost: {
        height: AutoMovieArchetypeBand.metres(12 * AutoMovieArchetypeUnits.FOOT, 12 * AutoMovieArchetypeUnits.FOOT, StreetFixtureBandsData.WAVE),
        diameter: AutoMovieArchetypeBand.metres(3 * AutoMovieArchetypeUnits.INCH, 3 * AutoMovieArchetypeUnits.INCH, `${StreetFixtureBandsData.WAVE}: the butt`),
        base: AutoMovieArchetypeBand.metres((9 + 1 / 4) * AutoMovieArchetypeUnits.INCH, (9 + 1 / 4) * AutoMovieArchetypeUnits.INCH, StreetFixtureBandsData.WAVE),
        baseHeight: AutoMovieArchetypeBand.metres((11 + 7 / 8) * AutoMovieArchetypeUnits.INCH, (11 + 7 / 8) * AutoMovieArchetypeUnits.INCH, `${StreetFixtureBandsData.WAVE}: the 11 7/8 in is unlabelled and taken as the base's`, true),
        head: AutoMovieArchetypeBand.metres(21 * AutoMovieArchetypeUnits.INCH, 21 * AutoMovieArchetypeUnits.INCH, StreetFixtureBandsData.STERNBERG),
        headHeight: AutoMovieArchetypeBand.metres(40 * AutoMovieArchetypeUnits.INCH, 40 * AutoMovieArchetypeUnits.INCH, StreetFixtureBandsData.STERNBERG),
        mass: AutoMovieArchetypeBand.of("kg", 20, 40, AutoMovieArchetypeBand.TYPICAL_MASS, true),
    },
    signPost: {
        height: AutoMovieArchetypeBand.metres(7 * AutoMovieArchetypeUnits.FOOT, 7 * AutoMovieArchetypeUnits.FOOT, StreetFixtureBandsData.SIGN),
        diameter: AutoMovieArchetypeBand.metres(2 * AutoMovieArchetypeUnits.INCH, 2 * AutoMovieArchetypeUnits.INCH, StreetFixtureBandsData.POST),
        mass: AutoMovieArchetypeBand.of("kg", 8, 15, AutoMovieArchetypeBand.TYPICAL_MASS, true),
    },
};
