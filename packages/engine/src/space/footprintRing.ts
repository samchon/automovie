import { IAutoMovieVector3 } from "@automovie/interface";
import { IAutoMovieFootprintRing } from "./IAutoMovieFootprintRing";

/**
 * Prepare one closed ring for repeated plan queries.
 *
 * @evidence requirements/staging/marks-zones-and-blocking.md#staging-zone-membership `footprintRing` prepares one closed ring for repeated plan queries. This ensures membership is judged from a subject footprint rather than a point.
 * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership `footprintRing` performs ring footprint evaluation when the engine resolves host-relative support geometry and whole-footprint zone membership.
 */
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
