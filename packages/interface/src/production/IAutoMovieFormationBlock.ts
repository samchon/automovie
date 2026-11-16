import { IAutoMovieFormationLayout } from "./IAutoMovieFormationLayout";

/**
 * One block of a formation design: a compact layout of some of its slots,
 * placed in the design's own frame, so a square, a battalion of companies
 * or a column of groups is one design.
 *
 * Slots are numbered across the blocks in order: block 0's first. A block's
 * layout lays its slots as the design's own layout would, then turns them by
 * `facing` and moves them by `offset` in the design's frame (lateral along
 * the frame's x, depth along its z, metres), before the design's anchor,
 * facing and terrain place them in the world.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a block is, how slots are numbered across blocks and the order of the placements, with units.
 * @evidence contracts/development/design.md#principled-representation The interface's layout union reused with a count, a planar offset in metres and a facing in degrees; the frame order is the one formation placement already uses.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The four members a block's slots are placed by; read by the engine's slot placement and written by the motions package's population.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No `square` layout: four faced blocks are one, and the layout union is not widened.
 */
export interface IAutoMovieFormationBlock {
  /** The block's compact layout. */
  layout: IAutoMovieFormationLayout;

  /** How many slots it holds, a positive whole number within its layout's capacity. */
  count: number;

  /** Where its origin stands in the design's frame, metres; the frame's origin when absent. */
  offset?: { lateral: number; depth: number };

  /** Which way it faces relative to the design, degrees; 0 when absent. */
  facing?: number;

  /** Its dressing's and scatter's seed, a whole number; the design's seed when absent. */
  seed?: number;
}
