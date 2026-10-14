import {
  IAutoMovieFormationBounds,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Create a call-owned bounds and running-mean fold for ascending slot points.
 *
 * @evidence contracts/common.md#principled-implementation Each point updates axis minima/maxima and the historical centroid*(n-1)/n+point/n fold; keeping this exact operation order preserves compiled population digests. Callers supply admitted finite positions in slot order.
 * @evidence contracts/common.md#clear-and-simple-design One accumulator owns the arithmetic shared by range, chunk and whole-population summaries; it exposes only add and finish instead of caching placement laws.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fixture or recipe changes the fold; an empty accumulator retains infinite bounds and zero centroid, so admitted populations must contain slots.
 * @evidence contracts/common.md#meaningful-documentation The returned methods document borrowed point inputs and transfer of the summary objects; callers finish only after all points and do not add after transfer.
 * @evidence contracts/performance.md#efficient-algorithms Each add performs constant arithmetic and retains three vectors and one count; N points take O(N) time and O(1) auxiliary memory.
 * @evidence contracts/performance.md#reuse-equivalent-work Range and chunk owners share the same fold implementation; each accumulator represents its own ordered point sequence and is never reused across mutable population inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the closure until finish returns its vectors; it holds no handles, callbacks or point history, and failures leave only ordinary collectable objects.
 */
export function createCompiledSlotSummary(): {
  /** Fold one borrowed finite position; no reference to the point is retained. */
  add: (point: IAutoMovieVector3) => void;

  /** Transfer the current vectors; the caller stops adding after this call. */
  finish: () => {
    bounds: IAutoMovieFormationBounds;
    centroid: IAutoMovieVector3;
  };
} {
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
