/**
 * The fixed grid of film seconds a person's displayed poses are sampled on
 * by a reader that tabulates them: `RATE` knots a second from second zero.
 *
 * The grid is the film's, not a query's, so the frame instants of 24, 30, 60
 * and 120 frames a second are all knots and two films of the same
 * performance share their knots.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the grid, its origin and why frame instants are knots.
 * @evidence contracts/development/design.md#principled-representation A fixed film grid that depends on no query: one rate from second zero.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The rate alone, read by the flight's shape table for its step.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No adaptive knots or per-query grid.
 */
export namespace HumanPoseKnots {
  /** Knots a film second. */
  export const RATE: number = 120;
}
