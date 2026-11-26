import {
  type IAutoMovieCreateCompiledSlotSummary,
  IAutoMovieFormationBounds,
  IAutoMovieVector3,
} from "@automovie/interface";

/** Create a call-owned bounds and running-mean fold for ascending slot points. */
export function createCompiledSlotSummary(): IAutoMovieCreateCompiledSlotSummary.IResult {
  const min: IAutoMovieVector3 = { x: Infinity, y: Infinity, z: Infinity };
  const max: IAutoMovieVector3 = { x: -Infinity, y: -Infinity, z: -Infinity };
  const centroid: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  let seen: number = 0;
  return {
    add: (point: IAutoMovieVector3): void => {
      min.x = Math.min(min.x, point.x);
      min.y = Math.min(min.y, point.y);
      min.z = Math.min(min.z, point.z);
      max.x = Math.max(max.x, point.x);
      max.y = Math.max(max.y, point.y);
      max.z = Math.max(max.z, point.z);
      ++seen;
      centroid.x = centroid.x * ((seen - 1) / seen) + point.x / seen;
      centroid.y = centroid.y * ((seen - 1) / seen) + point.y / seen;
      centroid.z = centroid.z * ((seen - 1) / seen) + point.z / seen;
    },
    finish: (): {
      bounds: IAutoMovieFormationBounds;
      centroid: IAutoMovieVector3;
    } => ({
      bounds: { min, max },
      centroid,
    }),
  };
}
