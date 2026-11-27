import { AutoMovieArchetypeUnits } from "../../core";
import type { AutoMovieArchetypeStreetFixture } from "../AutoMovieArchetypeStreetFixture";
/**
 * The figures each read model fixes, by kind and model, the default first: a
 * cone's height by its MUTCD class, 18 or 28 in (2009 MUTCD Section 6F.64,
 * https://mutcd.fhwa.dot.gov/htm/2009/part6/part6f.htm); a bollard's pipe and
 * mass by its Reliance R-1007 number, 4.50, 6.625, 8.625 and 10.750 in weighing
 * 76, 133, 200 and 284 lb
 * (https://www.reliance-foundry.com/wp-content/uploads/r-1007-xx-bollard-product-drawing.pdf);
 * a STOP sign's side by its MUTCD road class, 30 or 36 in (2009 MUTCD Table
 * 2B-1, https://mutcd.fhwa.dot.gov/htm/2009/part2/part2b.htm).
 */
export const STREET_FIXTURE_MODELS: Readonly<Partial<Record<AutoMovieArchetypeStreetFixture.Kind, Readonly<Partial<Record<AutoMovieArchetypeStreetFixture.Model, Readonly<Partial<Record<AutoMovieArchetypeStreetFixture.Dimension, number>>>>>>>>> = {
    trafficCone: {
        "cone 18 in": { height: 18 * AutoMovieArchetypeUnits.INCH },
        "cone 28 in": { height: 28 * AutoMovieArchetypeUnits.INCH },
    },
    bollard: {
        "R-1007-04": {
            diameter: 4.5 * AutoMovieArchetypeUnits.INCH,
            mass: 76 * AutoMovieArchetypeUnits.POUND,
        },
        "R-1007-06": {
            diameter: 6.625 * AutoMovieArchetypeUnits.INCH,
            mass: 133 * AutoMovieArchetypeUnits.POUND,
        },
        "R-1007-08": {
            diameter: 8.625 * AutoMovieArchetypeUnits.INCH,
            mass: 200 * AutoMovieArchetypeUnits.POUND,
        },
        "R-1007-10": {
            diameter: 10.75 * AutoMovieArchetypeUnits.INCH,
            mass: 284 * AutoMovieArchetypeUnits.POUND,
        },
    },
    signPost: {
        "STOP 30 in": { head: 30 * AutoMovieArchetypeUnits.INCH },
        "STOP 36 in": { head: 36 * AutoMovieArchetypeUnits.INCH },
    },
};
