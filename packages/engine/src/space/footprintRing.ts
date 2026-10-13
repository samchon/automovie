import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieFootprintRing } from "./IAutoMovieFootprintRing";

/** Prepare one closed ring for repeated plan queries. */
export const footprintRing = (
  points: readonly IAutoMovieVector3[],
): IAutoMovieFootprintRing => {
  const plan = points.map((point) => ({ x: point.x, y: point.z }));
  let doubleArea = 0;
  for (let index = 0; index < plan.length; ++index) {
    const current = plan[index]!;
    const next = plan[(index + 1) % plan.length]!;
    doubleArea += current.x * next.y - next.x * current.y;
  }
  return { points, plan, doubleArea };
};
