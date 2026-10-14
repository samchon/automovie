import { IAutoMovieDrawingPoint } from "./IAutoMovieDrawingPoint";

/**
 * Page bounding box of a drawing's content, in metres.
 *
 * Taken over every line endpoint, region and opening outline point, and every
 * resolved dimension endpoint and note anchor; stale targets contribute
 * nothing. `autoMovieDrawingToSvg` sizes the sheet from it plus a fixed margin.
 *
 * @evidence contracts/common.md#principled-implementation autoMovieDrawingExtent folds the listed page points into per-axis minima and maxima. For finite points this is their axis-aligned hull, excluding stroke thickness and note glyphs; it does not guarantee that all SVG ink fits inside the sheet after scale, margin and pen application.
 * @evidence contracts/common.md#clear-and-simple-design Two corner points are the whole box; width and height are derived by the serializer when it needs them rather than stored twice.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Stale targets and unmeasured note glyphs are left out rather than padded with a guessed size, and the latter is declared as a drawing gap.
 * @evidence contracts/common.md#meaningful-documentation States the units, exactly which points the box covers and excludes, and how the serializer uses it.
 * @author Samchon
 */
export interface IAutoMovieDrawingExtent {
  /** Lowest page coordinate on each axis. */
  min: IAutoMovieDrawingPoint;

  /** Highest page coordinate on each axis. */
  max: IAutoMovieDrawingPoint;
}
