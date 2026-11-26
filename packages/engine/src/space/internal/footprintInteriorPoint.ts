import {
  type IAutoMovieFootprint,
  type IAutoMovieFootprintInteriorPoint,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineSpace } from "../AutoMovieEngineSpace";


/** Choose an anchor from the widest convex piece of a footprint. */
export const footprintInteriorPoint: (
  footprint: IAutoMovieFootprint,
) => IAutoMovieFootprintInteriorPoint.IResult = (
  footprint: IAutoMovieFootprint,
): IAutoMovieFootprintInteriorPoint.IResult => {
  let best: IAutoMovieVector3[] | null = null;
  let bestArea: number = 0;
  for (const piece of AutoMovieEngineSpace.footprintConvexPieces(footprint)) {
    const area: number = Math.abs(AutoMovieEngineSpace.footprintRing(piece).doubleArea);
    if (area > bestArea) {
      best = piece;
      bestArea = area;
    }
  }
  if (best === null) return null;
  const sum: { x: number; z: number } = best.reduce(
    (
      total: { x: number; z: number },
      point: IAutoMovieVector3,
    ): { x: number; z: number } => ({
      x: total.x + point.x,
      z: total.z + point.z,
    }),
    { x: 0, z: 0 },
  );
  return { x: sum.x / best.length, z: sum.z / best.length };
};
