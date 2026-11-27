import {
  IAutoMovieDrawing,
  IAutoMovieDrawingExtent,
  IAutoMovieDrawingPoint,
} from "@automovie/interface";

/*
 * The page box that holds everything a sheet puts on paper, or `null` when
 * nothing is placed.
 *
 * Line ends, region and opening outline corners, resolved dimension ends and
 * resolved note anchors all count. Dimensions and notes are why this is not the
 * box around the linework: a dimension string is drawn beside the plan and a
 * note is led out past what it describes, and the serializer sizes the page
 * from this box, so anything outside it would fall outside the viewBox. A note
 * contributes its anchor, not its glyphs, which the derivation cannot measure
 * without font metrics and declares as a gap; a stale target has no place on
 * the page and contributes nothing.
 * Parameter drawing: The drawing's placed content.
 * Returns: The page box in metres, or `null`.
 */
export const autoMovieDrawingExtent = (
  drawing: Pick<
    IAutoMovieDrawing,
    "lines" | "regions" | "openings" | "dimensions" | "annotations"
  >,
): IAutoMovieDrawingExtent | null => {
  let minX: number = Number.POSITIVE_INFINITY;
  let minY: number = Number.POSITIVE_INFINITY;
  let maxX: number = Number.NEGATIVE_INFINITY;
  let maxY: number = Number.NEGATIVE_INFINITY;
  for (const point of placedPoints(drawing)) {
    if (point.x < minX) minX = point.x;
    if (point.y < minY) minY = point.y;
    if (point.x > maxX) maxX = point.x;
    if (point.y > maxY) maxY = point.y;
  }
  if (minX > maxX) return null;
  return { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } };
};

/*
 * Every page point the drawing places, without building an array.
 */
function* placedPoints(
  drawing: Pick<
    IAutoMovieDrawing,
    "lines" | "regions" | "openings" | "dimensions" | "annotations"
  >,
): Generator<IAutoMovieDrawingPoint, void, undefined> {
  for (const line of drawing.lines) {
    yield line.from;
    yield line.to;
  }
  for (const region of drawing.regions) yield* region.polygon;
  for (const mark of drawing.openings) yield* mark.polygon;
  for (const dimension of drawing.dimensions)
    if (dimension.status === "resolved") {
      yield dimension.from!;
      yield dimension.to!;
    }
  for (const annotation of drawing.annotations)
    if (annotation.status === "resolved") yield annotation.at!;
}
