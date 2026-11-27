import type { IAutoMovieDrawingPoint } from "./IAutoMovieDrawingPoint";

/**
 * Page bounding box of a drawing's content, in metres.
 *
 * Taken over every line endpoint, region and opening outline point, and every
 * resolved dimension endpoint and note anchor; stale targets contribute
 * nothing. `drawingToSvg` sizes the sheet from it plus a fixed
 * margin.
 */
export interface IAutoMovieDrawingExtent {
  /** Lowest page coordinate on each axis. */
  min: IAutoMovieDrawingPoint;

  /** Highest page coordinate on each axis. */
  max: IAutoMovieDrawingPoint;
}
