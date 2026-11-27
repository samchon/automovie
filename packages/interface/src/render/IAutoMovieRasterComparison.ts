import type { IAutoMovieRasterImage } from "./IAutoMovieRasterImage";

/**
 * What `AutoMovieRenderPicture.compareRasters` found between two pictures of one size: a
 * difference image to look at and the numbers that say how much changed and
 * where.
 */
export interface IAutoMovieRasterComparison {
  /** The newer picture in dimmed grey with every changed pixel in magenta. */
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
  bounds: {
    /** Inclusive leftmost changed pixel column, from zero. */
    left: number;
    /** Inclusive topmost changed pixel row, from zero. */
    top: number;
    /** Inclusive rightmost changed pixel column. */
    right: number;
    /** Inclusive bottommost changed pixel row. */
    bottom: number;
  } | null;
}
