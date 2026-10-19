/**
 * Select complete saved scalar slabs intersecting a declared physical window.
 * Scalars are millimetres along the observation's normalized sweep direction.
 * Positive overlap uses before < upper and after > lower; merely touching the
 * window does not select a slab. Endpoints are never moved or newly inserted.
 * The retained whole slabs may extend beyond the window, and report those bounds.
 *
 * @evidence contracts/common.md#principled-implementation Interval intersection restricts an already complete deterministic priority permutation without changing its relative order or the source clipping planes.
 * @evidence contracts/common.md#clear-and-simple-design One geometry-free selector owns window validation, selected addresses and declared versus actual whole-slab extent; observation remains a separate consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No anatomy, source topology, fitted success, coordinate snapping or per-subject control determines selection. An empty intersection remains an explicit empty domain.
 * @evidence contracts/common.md#meaningful-documentation States physical scalar units, positive-overlap endpoints, order preservation and conservative whole-slab scope.
 * @evidence contracts/performance.md#efficient-algorithms For N slabs, validation and selection use O(N) time and O(N) retained addresses; no mesh is read or allocated.
 * @evidence contracts/performance.md#reuse-equivalent-work The saved level array and complete priority order supply every selected address and bound without another station calculation or sorting pass.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One local permutation set expires on return; the caller owns the bounded selected address array and scalar metadata, with no source references or handles retained.
 */
export function selectRecoveryScalarIntervals(
  levelsMm: readonly number[],
  order: readonly number[],
  windowMm?: readonly [number, number],
): {
  intervals: number[];
  windowMm: [number, number] | null;
  wholeSlabBoundsMm: [number, number] | null;
  excludedIntervals: number;
} {
  if (
    levelsMm.length < 2 ||
    levelsMm.some(
      (value: number, i: number): boolean =>
        !Number.isFinite(value) || (i > 0 && value <= levelsMm[i - 1]!),
    )
  )
    throw new Error("Finite increasing scalar levels are required");
  if (
    order.length !== levelsMm.length - 1 ||
    new Set(order).size !== order.length ||
    order.some(
      (id: number): boolean =>
        !Number.isSafeInteger(id) || id < 0 || id >= order.length,
    )
  )
    throw new Error(
      "Scalar priority must be a complete saved-interval permutation",
    );
  if (
    windowMm &&
    (windowMm.length !== 2 ||
      !windowMm.every(Number.isFinite) ||
      !(windowMm[0] < windowMm[1]))
  )
    throw new Error("An increasing finite physical scalar window is required");
  const intervals: number[] = order.filter(
    (id: number): boolean =>
      !windowMm ||
      (levelsMm[id]! < windowMm[1] && levelsMm[id + 1]! > windowMm[0]),
  );
  let lower: number = Infinity,
    upper: number = -Infinity;
  for (const id of intervals) {
    lower = Math.min(lower, levelsMm[id]!);
    upper = Math.max(upper, levelsMm[id + 1]!);
  }
  return {
    intervals,
    windowMm: windowMm ? [windowMm[0], windowMm[1]] : null,
    wholeSlabBoundsMm: intervals.length ? [lower, upper] : null,
    excludedIntervals: order.length - intervals.length,
  };
}
