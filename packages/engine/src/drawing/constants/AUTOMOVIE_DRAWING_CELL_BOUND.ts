/**
 * Half-extent of the square a logical cell's cross-section is clipped out of,
 * in metres.
 *
 * A convex cell is an intersection of half-spaces, and nothing in the design
 * forces that intersection to be bounded. Clipping starts from a square this
 * large and reports an unbounded result rather than printing a ten-kilometre
 * room as if somebody had drawn it.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Makes an unbounded logical-space section detectable instead of presenting the clipping seed as a plausible room outline.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Supplies the `10,000` metre half-extent whose surviving boundary marks a half-space intersection as unbounded.
 */
export const AUTOMOVIE_DRAWING_CELL_BOUND = 1e4;
