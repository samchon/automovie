import { IAutoMovieDrawingPoint } from "./IAutoMovieDrawingPoint";

/**
 * Page bounding box of a drawing's content, in metres.
 *
 * Taken over every line endpoint, region and opening outline point, and every
 * resolved dimension endpoint and note anchor; stale targets contribute
 * nothing. `autoMovieDrawingToSvg` sizes the sheet from it.
 *
 * @author Samchon
 */
export interface IAutoMovieDrawingExtent {
  /** Lowest page coordinate on each axis. */
  min: IAutoMovieDrawingPoint;

  /** Highest page coordinate on each axis. */
  max: IAutoMovieDrawingPoint;
}
