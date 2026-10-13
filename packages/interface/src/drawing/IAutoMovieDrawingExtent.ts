import { IAutoMovieDrawingPoint } from "./IAutoMovieDrawingPoint";

/**
 * Page bounding box of a drawing's content, in metres.
 *
 * Taken over every line endpoint, region and opening outline point, and every
 * resolved dimension endpoint and note anchor; stale targets contribute
 * nothing. `autoMovieDrawingToSvg` sizes the sheet from it.
 *
 * @evidence contracts/common.md#principled-implementation An axis-aligned bounding box from the per-axis minimum and maximum over every point the sheet places, taken after rounding, so it sits on the same six-decimal grid as its points.
 * @evidence contracts/common.md#clear-and-simple-design Two corner points and nothing else; the drawing's `extent` is nullable instead of storing an empty or inverted box.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Note glyph extents are excluded because no font metrics exist, a limit declared through the `note-text-extent` gap rather than padded with a guessed margin.
 * @evidence contracts/common.md#meaningful-documentation States the unit, which points are included, that stale targets are left out, and which serializer reads the box.
 * @author Samchon
 */
export interface IAutoMovieDrawingExtent {
  /** Lowest page coordinate on each axis. */
  min: IAutoMovieDrawingPoint;

  /** Highest page coordinate on each axis. */
  max: IAutoMovieDrawingPoint;
}
