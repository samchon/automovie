import { AutoMovieArchetypeUnits } from "../core";

/**
 * A hinged leaf's breaking energy, joules: 80 J, the lowest impact level of
 * ASTM F476-14's ram test, at which "a typical softwood door frame without
 * reinforcement will break and allow the door to be forced open", as US
 * patent 11280110 B1 states it
 * (https://patents.google.com/patent/US11280110B1/en); a ram's blow,
 * provisional for a kick, which no source read measures.
 */
export const BREAKING: number = 80;

/** The kinds of door. */
export type Kind = "hinged" | "sliding";

/** Every kind, for a caller that reads one at run time. */
export const KINDS: readonly Kind[] = ["hinged", "sliding"];

/**
 * What a hand operates a hinged door by: a lever or a knob that draws a
 * latch, or a push plate and a pull bar on a door without one.
 */
export type Hardware = "lever" | "knob" | "plate";

/** Every hardware, for a caller that reads one at run time. */
export const HARDWARE: readonly Hardware[] = ["lever", "knob", "plate"];

/**
 * A pull bar's centre above the floor, metres: ANSI/SDI A250.8-2017 Table 5,
 * centreline of grip at 42 in.
 */
export const PULL_HEIGHT: number = 42 * AutoMovieArchetypeUnits.INCH;

/**
 * A push plate's centre above the floor, metres: ANSI/SDI A250.8-2017 Table
 * 5, centreline at 45 in.
 */
export const PLATE_HEIGHT: number = 45 * AutoMovieArchetypeUnits.INCH;

/**
 * A push plate's width and height, metres: a 4 by 16 in plate, a common
 * catalogue size, not read at a source.
 */
export const PLATE: Readonly<{ width: number; height: number }> = {
  width: 4 * AutoMovieArchetypeUnits.INCH,
  height: 16 * AutoMovieArchetypeUnits.INCH,
};

/**
 * A pull bar's grip length and its clearance from the leaf's face, metres:
 * estimates, not read at a source.
 */
export const PULL: Readonly<{ length: number; clearance: number }> = {
  length: 0.2,
  clearance: 0.038,
};
