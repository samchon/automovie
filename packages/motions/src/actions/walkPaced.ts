import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import type { walkStation } from "./walkStation";

/**
 * A stepping plan played on a tabulated clock: at each film second the body is
 * where the plan has it at the plan second the table gives, so the body can set
 * off late, slow, stand and hurry on its own footprints.
 *
 * The plan's footprints, path and poses are its own; only the film second at
 * which the body passes each of them is the table's. Between two entries the
 * plan second is linear in the film second.
 *
 * @param plan The stepping plan at its own pace.
 * @param step Film seconds between two entries of the clock.
 * @param clock The plan second at each film second `index * step`: 0 first, the
 *   plan's duration last, never falling.
 * @returns The plan on that clock, as long as the table, with its events,
 *   contact windows and decisive instant moved to the first film second that
 *   reaches them.
 */
export function walkPaced(
  plan: walkStation.IPlan,
  step: number,
  clock: readonly number[],
): walkStation.IPlan {
  const last: number = clock.length - 1;
  const until: number = last * step;
  if (last < 1) return plan;
  const toPlan: (film: number) => number = (film: number): number => {
    const at: number = Math.min(last, Math.max(0, film / step));
    const i: number = Math.min(last - 1, Math.floor(at));
    return clock[i]! + (clock[i + 1]! - clock[i]!) * (at - i);
  };

  // The first film second at which the clock has reached a plan second.
  const toFilm: (planned: number) => number = (planned: number): number => {
    if (planned <= clock[0]!) return 0;
    let low: number = 0;
    let high: number = last;
    while (high - low > 1) {
      const middle: number = (low + high) >> 1;
      if (clock[middle]! < planned) low = middle;
      else high = middle;
    }
    const span: number = clock[high]! - clock[low]!;
    return (
      (low + (span < 1e-12 ? 1 : Math.min(1, (planned - clock[low]!) / span))) *
      step
    );
  };
  const moved: (was: number) => number = (was: number): number =>
    toFilm(was * plan.duration) / until;
  const source: walkStation.HorizontalRoot | undefined = plan.horizontalRoot;
  return {
    ...plan,
    duration: until,
    events: plan.events.map(
      (e: IAutoMovieMotionEvent): IAutoMovieMotionEvent => ({
        ...e,
        share: moved(e.share),
      }),
    ),
    contacts: plan.contacts.map(
      (
        c: IAutoMovieMotionHumanContactWindow,
      ): IAutoMovieMotionHumanContactWindow => ({
        ...c,
        from: moved(c.from),
        to: moved(c.to),
      }),
    ),
    ...(plan.contact === undefined ? {} : { contact: toFilm(plan.contact) }),
    ...(source === undefined
      ? {}
      : {
          horizontalRoot: (seconds: number): walkStation.HorizontalPoint =>
            source(toPlan(seconds)),
        }),
    posture: (
      film: number,
      channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): IAutoMovieMotionHumanPosture =>
      plan.posture(toPlan(film), channels, resolution, projection),
  };
}
