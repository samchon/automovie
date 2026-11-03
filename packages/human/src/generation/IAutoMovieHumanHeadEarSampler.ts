import type { AutoMovieHumanEarConstruction } from "./AutoMovieHumanEarConstruction";

/**
 * What every piece of one auricle reads to draw its loops on one side of the
 * head: the ear's own heights and the loops the head's skin gives it at a
 * height, in the left frame. The sampler is the ear's fixed input: it holds the
 * ear's heights and the functions that return one free loop and the pieces'
 * shared profiles along the ear's height. A piece never reads the head's skin
 * directly.
 */
export interface IAutoMovieHumanHeadEarSampler {
  /**
   * A free loop at a height: the ear's path closed, off the head by `f`.
   *
   * @param y Height of the loop.
   * @param f Share of the path's roots drawn in from the head to the ear's own rim.
   * @param folds Share of the anterior reliefs drawn.
   */
  free: (y: number, f: number, folds: number) => AutoMovieHumanEarConstruction.P2[];

  /** Share of the ear off the head at a height: 0 at the upper attachment to 1 at the top. */
  rise: (y: number) => number;

  /** Share of the lobe drawn in toward its pole at a height: 1 at the bottom to 0 at the lobe's top. */
  sink: (y: number) => number;

  /** Share of the anterior reliefs left at a height over the helix's rim: 1 at the split to 0 at the top. */
  fold: (y: number) => number;

  /** The pocket under the helix's roll at a height: a small oval that closes toward the roof. */
  pocketOval: (y: number) => AutoMovieHumanEarConstruction.P2[];

  /** The ear's heights: its lowest point, the lobe's top, the upper attachment, the pocket's split, its roof and the top. */
  ear: Pick<
    AutoMovieHumanEarConstruction.IEar,
    "bottom" | "lower" | "upper" | "split" | "roof" | "top"
  >;
}
