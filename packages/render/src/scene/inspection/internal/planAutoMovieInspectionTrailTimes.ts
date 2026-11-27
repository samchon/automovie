import type { IAutoMoviePlanInspectionTrailTimesProps } from "@automovie/interface";

/**
 * The seconds a trail is sampled at for one drawn second: a grid of `ticks` per
 * second through the drawn second, reaching `reach` seconds before and after
 * it, clipped to the subject's running time.
 *
 * The drawn second is always one of the times, so
 * `markAutoMovieInspectionTrails` emphasises exactly the place drawn, and every
 * other time is the drawn second plus a whole number of tick intervals. Times
 * are ascending. A host passes them, with the request's `trail` patterns, to
 * `sampleAutoMovieInspectionTrails`.
 *
 * It throws for a drawn second outside `[0, durationSeconds]`, a running time
 * that is not positive and finite, and a reach or tick rate that is not
 * positive and finite.
 *
 * ```ts
 * const times = planAutoMovieInspectionTrailTimes({
 *   request,
 *   seconds,
 *   durationSeconds,
 * });
 * const trails =
 *   request.trail.length === 0
 *     ? []
 *     : await sampleAutoMovieInspectionTrails({
 *         scene,
 *         pattern,
 *         times,
 *         seek,
 *       });
 * ```
 */
export function planAutoMovieInspectionTrailTimes(
  props: IAutoMoviePlanInspectionTrailTimesProps,
): number[] {
  const reach: number = props.request.reach;
  const ticks: number = props.request.ticks;
  if (!(props.durationSeconds > 0))
    throw new Error(
      `Trail running time ${props.durationSeconds} is not a positive number of seconds`,
    );
  if (!(props.seconds >= 0 && props.seconds <= props.durationSeconds))
    throw new Error(
      `Trail second ${props.seconds} is outside the subject's ${props.durationSeconds} seconds`,
    );
  if (!(reach > 0 && ticks > 0))
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
