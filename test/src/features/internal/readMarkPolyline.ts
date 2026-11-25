import type { IAutoMovieMark } from "@automovie/interface";

/** A mark's polyline shape, refusing a mark of another shape. */
export function readMarkPolyline(
  mark: IAutoMovieMark | undefined,
): IAutoMovieMark.IPolyline {
  if (mark === undefined || mark.shape.type !== "polyline")
    throw new Error("Expected a mark of polyline");
  return mark.shape;
}
