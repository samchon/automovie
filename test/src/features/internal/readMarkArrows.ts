import type { IAutoMovieMark } from "@automovie/interface";

/** A mark's arrows shape, refusing a mark of another shape. */
export function readMarkArrows(
  mark: IAutoMovieMark | undefined,
): IAutoMovieMark.IArrows {
  if (mark === undefined || mark.shape.type !== "arrows")
    throw new Error("Expected a mark of arrows");
  return mark.shape;
}
