/**
 * Half-extent of the square a logical cell's cross-section is clipped out of,
 * in metres.
 *
 * A convex cell is an intersection of half-spaces, and nothing in the design
 * forces that intersection to be bounded. Clipping starts from a square this
 * large and reports an unbounded result rather than printing a ten-kilometre
 * room as if somebody had drawn it.
 */
export const AUTOMOVIE_DRAWING_CELL_BOUND = 1e4;
