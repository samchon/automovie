import {
  type IAutoMovieFootprintRing,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * Prepare a borrowed world ring and its owned XZ projection for repeated
 * footprint queries.
 */
export const footprintRing: (
  points: readonly IAutoMovieVector3[],
) => IAutoMovieFootprintRing = (
  points: readonly IAutoMovieVector3[],
): IAutoMovieFootprintRing => {
  const plan: { x: number; y: number }[] = points.map(
    (point: IAutoMovieVector3): { x: number; y: number } => ({
      x: point.x,
      y: point.z,
    }),
  );
  let doubleArea: number = 0;
  for (let index: number = 0; index < plan.length; ++index) {
    const current: { x: number; y: number } = plan[index]!;
    const next: { x: number; y: number } = plan[(index + 1) % plan.length]!;
    doubleArea += current.x * next.y - next.x * current.y;
  }
  return { points, plan, doubleArea };
};
