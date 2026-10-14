/**
 * Decimal places every page coordinate, area and length is rounded to.
 *
 * A drawing is evidence, and evidence that differs in its sixteenth decimal
 * between two runs is not comparable by digest. Six places is a micrometre at
 * building scale: finer than any construction tolerance and coarse enough that
 * the last bits of an accumulated dot product cannot move it.
 */
export const AUTOMOVIE_DRAWING_DECIMALS = 6;
