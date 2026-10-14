import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Compile a sampled loop's azimuth about the vertical line through center, measured from +Z towards +X in the Y-up frame and wrapped to (-pi,pi]. The caller supplies finite coordinates and a radial single-turn loop with distinct angular samples; the sampled winding/direction test is not a full geometric star-shape or global embedding proof.
 *
 * At least three vertices and a sampled total turn within 1e-6 radians of one revolution are required, with no mixed positive/negative steps. Zero angular steps are tolerated; tied angular samples select one resident and cannot distinguish multiple radial points at the same angle. The returned angle table is owned but mutable; consumers must not alter it. Finite query angles wrap with bounded remainder arithmetic instead of an angle-sized subtraction loop.
 *
 * bracket returns original loop indices and a dimensionless fraction. An exact angular sample selects the last tied low index; cyclic high handles the pi seam. This lookup provides correspondence, not anatomical neck admission or a current visual result.
 *
 * @evidence contracts/common.md#principled-implementation Actual loop coordinates and sampled oriented turns determine the cyclic angular correspondence used by neck height/face weight consumers.
 * @evidence contracts/common.md#clear-and-simple-design One compiled angular table and increasing cyclic order serve binary-search brackets; callers retain source geometry/admission ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Mixed-direction/non-single-turn samples refuse, nonfinite queries refuse, and the numerical winding tolerance is not promoted into a full star-shape, distinct-angle or clinical proof.
 * @evidence contracts/common.md#meaningful-documentation Prose states radian frame, 1e-6 turn policy, mutable table/distinct-sample premises, cyclic ties and bounded wrapping.
 * @evidence contracts/performance.md#efficient-algorithms Linear turn/order compilation precedes O(log N) binary lookup; remainder wrapping is constant work even for large finite query angles.
 * @evidence contracts/performance.md#reuse-equivalent-work The same source angular order serves repeated query brackets without recomputing atan2 or winding per evaluated vertex.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains only N-sized angular/order tables, with no source mesh, timer or render resource; consumers own table and closure lifetime.
 */
export function createHumanLoopAzimuth(
  loop: readonly IAutoMovieVector3[],
  center: { x: number; z: number },
): {
  angle: number[];
  bracket: (angle: number) => { low: number; high: number; along: number };
} {
  const count: number = loop.length;
  if (count < 3) throw new Error("A loop around an axis needs three vertices.");
  const wrap: (value: number) => number = (value: number): number => {
    if (!Number.isFinite(value))
      throw new Error("A loop azimuth needs a finite angle.");
    let wrapped: number = value % (2 * Math.PI);
    if (wrapped <= -Math.PI) wrapped += 2 * Math.PI;
    if (wrapped > Math.PI) wrapped -= 2 * Math.PI;
    return wrapped;
  };
  const angle: number[] = loop.map((point: IAutoMovieVector3): number =>
    wrap(Math.atan2(point.x - center.x, point.z - center.z)),
  );
  let total: number = 0;
  let increasing: number = 0;
  let decreasing: number = 0;
  for (let k: number = 0; k < count; k++) {
    const step: number = wrap(angle[(k + 1) % count] - angle[k]);
    total += step;
    if (step > 0) increasing++;
    if (step < 0) decreasing++;
  }
  if (
    Math.abs(Math.abs(total) - 2 * Math.PI) > 1e-6 ||
    (increasing > 0 && decreasing > 0)
  )
    throw new Error(
      "The loop does not wind once around its axis in one direction.",
    );
  // loop indices in increasing angle, from the smallest angle
  const walk: number[] =
    total > 0
      ? loop.map((_: IAutoMovieVector3, k: number): number => k)
      : loop.map((_: IAutoMovieVector3, k: number): number => count - 1 - k);
  let first: number = 0;
  for (let k: number = 1; k < count; k++)
    if (angle[walk[k]] < angle[walk[first]]) first = k;
  const order: number[] = walk.map(
    (_: number, k: number): number => walk[(first + k) % count],
  );
  const sorted: number[] = order.map((index: number): number => angle[index]);
  return {
    angle,
    bracket: (value: number): { low: number; high: number; along: number } => {
      const at: number = wrap(value);
      // the last sorted angle not above `at`, or the largest when `at` lies
      // below all of them (the interval that wraps through pi)
      let lo: number = 0;
      let hi: number = count - 1;
      if (at < sorted[0]) lo = count - 1;
      else {
        while (lo < hi) {
          const middle: number = (lo + hi + 1) >> 1;
          if (sorted[middle] <= at) lo = middle;
          else hi = middle - 1;
        }
      }
      const next: number = (lo + 1) % count;
      const start: number = sorted[lo];
      let end: number = sorted[next];
      let target: number = at;
      if (end < start) end += 2 * Math.PI;
      if (target < start) target += 2 * Math.PI;
      const span: number = end - start;
      return {
        low: order[lo],
        high: order[next],
        along: Math.min(1, Math.max(0, (target - start) / span)),
      };
    },
  };
}
