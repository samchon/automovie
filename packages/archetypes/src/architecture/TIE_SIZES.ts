import { AutoMovieArchetypeUnits } from "../core";
import type { AutoMovieArchetypeObstacle } from "./AutoMovieArchetypeObstacle";
/**
 * A crosstie's read sizes, metres: its section as laid, depth by face, and its
 * length, each from the University of Kentucky's FOR-108 lists, Producing and
 * Inspecting Railroad Crossties
 * (https://publications.mgcafe.uky.edu/sites/publications.ca.uky.edu/files/FOR108.pdf):
 * "most commonly 7 x 9 in, some 6 x 8 and 7 x 8 in"; 8 ft 6 in the most common
 * length, 8 ft standard, 9 ft sometimes required.
 */
export const TIE_SIZES: Readonly<{
    section: Readonly<Partial<Record<AutoMovieArchetypeObstacle.Kind, Readonly<Record<AutoMovieArchetypeObstacle.Section, Readonly<Partial<Record<AutoMovieArchetypeObstacle.Dimension, number>>>>>>>>;
    length: Readonly<Partial<Record<AutoMovieArchetypeObstacle.Kind, Readonly<Record<AutoMovieArchetypeObstacle.TieLength, Readonly<Partial<Record<AutoMovieArchetypeObstacle.Dimension, number>>>>>>>>;
}> = {
    section: {
        crosstie: {
            "7x9in": {
                height: 7 * AutoMovieArchetypeUnits.INCH,
                width: 9 * AutoMovieArchetypeUnits.INCH,
            },
            "6x8in": {
                height: 6 * AutoMovieArchetypeUnits.INCH,
                width: 8 * AutoMovieArchetypeUnits.INCH,
            },
            "7x8in": {
                height: 7 * AutoMovieArchetypeUnits.INCH,
                width: 8 * AutoMovieArchetypeUnits.INCH,
            },
        },
    },
    length: {
        crosstie: {
            "8ft6in": { length: 8.5 * AutoMovieArchetypeUnits.FOOT },
            "8ft": { length: 8 * AutoMovieArchetypeUnits.FOOT },
            "9ft": { length: 9 * AutoMovieArchetypeUnits.FOOT },
        },
    },
};
