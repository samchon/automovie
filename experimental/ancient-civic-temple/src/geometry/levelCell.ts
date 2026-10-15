import type { IAutoMovieConvexSpaceCell } from "@automovie/interface";
import type { PlanRectangle } from "./PlanRectangle";
import { polygonCell } from "./polygonCell";
import { rectanglePolygon } from "./rectanglePolygon";

/** A finite open yard or low-ceiling body. The upper bound is not render geometry. */

export const levelCell = (
  id: string, rect: PlanRectangle, floor: number, ceiling: number
): IAutoMovieConvexSpaceCell => polygonCell(
  id, rectanglePolygon(rect), floor, { x: 0, z: 0, constant: ceiling }
);
