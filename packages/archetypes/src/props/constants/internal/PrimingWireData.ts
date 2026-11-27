import { AutoMovieArchetypeUnits } from "../../../core";

/*
 * The read wire, ring and stems, metres, and the garrison wire's weight,
 * kilograms.
 */
export const WIRE: number = 0.175 * AutoMovieArchetypeUnits.INCH;

export const RING: number = 2 * AutoMovieArchetypeUnits.INCH;

export const FIELD: number = 8 * AutoMovieArchetypeUnits.INCH;

export const GARRISON: number = 14 * AutoMovieArchetypeUnits.INCH;

export const GARRISON_MASS: number = 0.08 * AutoMovieArchetypeUnits.POUND;

/*
 * The length of wire in the ring, metres: its circumference at the wire's
 * centre line.
 */
export const RING_WIRE: number = Math.PI * (RING - WIRE);
