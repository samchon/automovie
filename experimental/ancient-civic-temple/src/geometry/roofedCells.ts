import type { IAutoMovieConvexSpaceCell } from "@automovie/interface";
import { partitionPlan } from "./partitionPlan";
import type { PlanRectangle } from "./PlanRectangle";
import { polygonCell } from "./polygonCell";
import { rectanglePolygon } from "./rectanglePolygon";
import type { RoofPatch } from "./RoofPatch";
import { area } from "./area";

/** Decomposes per real composed roof piece and requires the whole room plan to be covered. The underside is lower by the piece's vertical thickness. */

export const roofedCells = (
  id: string, rect: PlanRectangle, floor: number, roof: readonly RoofPatch[]
): IAutoMovieConvexSpaceCell[] => {
  const bounds = rectanglePolygon(rect);
  let covered = 0;
  const cells = roof.flatMap((patch) => {
    const { inside } = partitionPlan(bounds, patch.polygon);
    if (inside.length === 0) return [];
    covered += area(inside);
    return [polygonCell(`${id}.${patch.id}`, inside, floor, {
      ...patch.height, constant: patch.height.constant - patch.thickness,
    })];
  });
  if (Math.abs(covered - area(bounds)) > 1e-6) {
    throw new Error(`${id}: roof coverage ${covered}m² differs from the body ${area(bounds)}m².`);
  }
  return cells;
};
