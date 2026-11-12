import type { IAutoMovieRasterImage } from "./IAutoMovieRasterImage.js";

/**
 * What `compareAutoMovieRasters` found between two pictures of one size: a
 * difference image to look at and the numbers that say how much changed and
 * where.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the producing call; each member states its unit, range and what an unchanged pair yields.
 * @evidence contracts/development/design.md#principled-representation A reviewer needs the picture and a gate needs the count, so both come from one pass; the box says where to look and is null when nothing changed instead of an empty rectangle.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Five members: the image a sheet takes, and the count, share, magnitude and place a comparison record takes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No pass or fail verdict is stored; the threshold belongs to the caller who knows what was meant to change.
 */
export interface IAutoMovieRasterComparison {
  /**
   * The newer picture in dimmed grey with every changed pixel in magenta.
   */
  image: IAutoMovieRasterImage;

  /** Number of pixels whose largest channel difference exceeds the tolerance. */
  changed: number;

  /** `changed` over the pixel count, in [0, 1]. */
  ratio: number;

  /** Largest channel difference found anywhere, 0 to 255, tolerance not applied. */
  maximum: number;

  /**
   * Smallest box holding every changed pixel, in inclusive pixel coordinates
   * from the top-left corner, or null when no pixel changed.
   */
  bounds: { left: number; top: number; right: number; bottom: number } | null;
}
