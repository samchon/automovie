import type { IAutoMovieInspectionRequest } from "./IAutoMovieInspectionRequest.js";

/**
 * The seconds a trail is sampled at for one drawn second: a grid of `ticks` per second through the drawn second, reaching `reach` seconds before and after it, clipped to the subject's running time.
 *
 * The drawn second is always one of the times, so `markAutoMovieInspectionTrails` emphasises exactly the place drawn, and every other time is the drawn second plus a whole number of tick intervals. Times are ascending. A host passes them, with the request's `trail` patterns, to `sampleAutoMovieInspectionTrails`.
 *
 * It throws for a drawn second outside `[0, durationSeconds]`, a running time that is not positive and finite, and a reach or tick rate that is not positive and finite.
 *
 * ```ts
 * const times = planAutoMovieInspectionTrailTimes({ request, seconds, durationSeconds });
 * const trails = request.trail.length === 0 ? [] : await sampleAutoMovieInspectionTrails({ scene, pattern, times, seek });
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the grid, why it passes through the drawn second, the clipping, the order, how a host uses the times, and the refusals.
 * @evidence contracts/development/implementation.md#principled-implementation Each time is the drawn second plus an integer multiple of `1 / ticks`, computed from the integer rather than accumulated, so the grid has no drift and the drawn second is exact.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission, then one loop over the integer offsets within the reach.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The window is the request's stated reach and rate, and a time outside the subject is dropped rather than clamped onto its ends, which would sample one place twice.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the times returned, `2 reach ticks + 1` at most.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its arguments.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh list and keeps nothing.
 */
export function planAutoMovieInspectionTrailTimes(props: {
  /** The request's trail window. */
  request: Pick<IAutoMovieInspectionRequest, "reach" | "ticks">;

  /** The drawn film second. */
  seconds: number;

  /** The subject's running time, seconds. */
  durationSeconds: number;
}): number[] {
  const reach: number = props.request.reach;
  const ticks: number = props.request.ticks;
  if (!(Number.isFinite(props.durationSeconds) && props.durationSeconds > 0))
    throw new Error(
      `Trail running time ${props.durationSeconds} is not a positive number of seconds`,
    );
  if (!(props.seconds >= 0 && props.seconds <= props.durationSeconds))
    throw new Error(
      `Trail second ${props.seconds} is outside the subject's ${props.durationSeconds} seconds`,
    );
  if (
    !(
      Number.isFinite(reach) &&
      reach > 0 &&
      Number.isFinite(ticks) &&
      ticks > 0
    )
  )
    throw new Error(
      `Trail reach ${reach} and ticks ${ticks} are not positive finite numbers`,
    );

  // Offsets are whole tick counts; the small allowance keeps a reach that is an exact multiple of the interval.
  const span: number = Math.floor(reach * ticks + 1e-9);
  const times: number[] = [];
  for (let k: number = -span; k <= span; k++) {
    const time: number = k === 0 ? props.seconds : props.seconds + k / ticks;
    if (time >= 0 && time <= props.durationSeconds) times.push(time);
  }
  return times;
}
