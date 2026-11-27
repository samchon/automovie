import type { IAutoMovieRecoveryScalarIntervalsSelectionOperation } from "@automovie/interface";

/*
 * Select complete saved scalar slabs intersecting a declared physical window.
 * Scalars are millimetres along the observation's normalized sweep direction.
 * Positive overlap uses before < upper and after > lower; merely touching the
 * window does not select a slab. Endpoints are never moved or newly inserted.
 * The retained whole slabs may extend beyond the window, and report those
 * bounds.
 */
export function selectRecoveryScalarIntervals(
  levelsMm: Parameters<IAutoMovieRecoveryScalarIntervalsSelectionOperation.Operation>[0],
  order: Parameters<IAutoMovieRecoveryScalarIntervalsSelectionOperation.Operation>[1],
  windowMm?: Parameters<IAutoMovieRecoveryScalarIntervalsSelectionOperation.Operation>[2],
): ReturnType<IAutoMovieRecoveryScalarIntervalsSelectionOperation.Operation> {
  if (
    levelsMm.length < 2 ||
    levelsMm.some(
      (value: number, i: number): boolean => i > 0 && value <= levelsMm[i - 1]!,
    )
  )
    throw new Error("Finite increasing scalar levels are required");
  if (
    order.length !== levelsMm.length - 1 ||
    new Set(order).size !== order.length ||
    order.some((id: number): boolean => id < 0 || id >= order.length)
  )
    throw new Error(
      "Scalar priority must be a complete saved-interval permutation",
    );
  if (
    windowMm &&
    (!Number.isFinite(windowMm.lowerMm) ||
      !Number.isFinite(windowMm.upperMm) ||
      !(windowMm.lowerMm < windowMm.upperMm))
  )
    throw new Error("An increasing finite physical scalar window is required");
  const intervals: number[] = order.filter(
    (id: number): boolean =>
      !windowMm ||
      (levelsMm[id]! < windowMm.upperMm &&
        levelsMm[id + 1]! > windowMm.lowerMm),
  );
  let lower: number = Infinity,
    upper: number = -Infinity;
  for (const id of intervals) {
    lower = Math.min(lower, levelsMm[id]!);
    upper = Math.max(upper, levelsMm[id + 1]!);
  }
  return {
    intervals,
    windowMm: windowMm ? [windowMm.lowerMm, windowMm.upperMm] : null,
    wholeSlabBoundsMm: intervals.length ? [lower, upper] : null,
    excludedIntervals: order.length - intervals.length,
  };
}
