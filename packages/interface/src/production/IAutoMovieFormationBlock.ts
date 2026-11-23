import type { IAutoMovieFormationLayout } from "./IAutoMovieFormationLayout";

/**
 * One block of a formation design: a compact layout of some of its slots,
 * placed in the design's own frame, so a square, a battalion of companies or a
 * column of groups is one design.
 *
 * Slots are numbered across the blocks in order: block 0's first. A block's
 * layout lays its slots as the design's own layout would, then turns them by
 * `facing` and moves them by `offset` in the design's frame (lateral along the
 * frame's x, depth along its z, metres), before the design's anchor, facing and
 * terrain place them in the world.
 */
export interface IAutoMovieFormationBlock {
  /** The block's compact layout. */
  layout: IAutoMovieFormationLayout;

  /**
   * How many slots it holds, a positive whole number within its layout's
   * capacity.
   */
  count: number;

  /**
   * Where its origin stands in the design's frame, metres; the frame's origin
   * when absent.
   */
  offset?: {
    /** Metres along the formation design frame's X axis. */
    lateral: number;

    /** Metres along the formation design frame's Z axis. */
    depth: number;
  };

  /** Which way it faces relative to the design, degrees; 0 when absent. */
  facing?: number;

  /**
   * Its dressing's and scatter's seed, a whole number; the design's seed when
   * absent.
   */
  seed?: number;
}
