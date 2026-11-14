import type { IAutoMovieMotionEvent } from "@automovie/interface";

import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * A stepping plan played on a tabulated clock: at each film second the body
 * is where the plan has it at the plan second the table gives, so the body
 * can set off late, slow, stand and hurry on its own footprints.
 *
 * The plan's footprints, path and poses are its own; only the film second
 * at which the body passes each of them is the table's. Between two
 * entries the plan second is linear in the film second.
 *
 * @param plan The stepping plan at its own pace.
 * @param step Film seconds between two entries of the clock.
 * @param clock The plan second at each film second `index * step`: 0 first, the plan's duration last, never falling.
 * @returns The plan on that clock, as long as the table, with its events, contact windows and decisive instant moved to the first film second that reaches them.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the clock moves, what stays the plan's own and how the table is read.
 * @evidence contracts/development/implementation.md#principled-implementation A time warp: the pose stays a pure function of the film second, and every named instant is mapped by the same table, so events, contacts and poses agree. It never runs backwards because the table never falls.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Two maps over one table: film to plan by index, plan to film by a binary search.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The table is taken as given; what pace it may ask is its maker's to bound.
 * @evidence contracts/development/implementation.md#efficient-algorithms A pose costs one index; a named instant one binary search of the table.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to cache: the table is the cache.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Holds the plan and the table for as long as the returned plan is held.
 */
export function walkPaced(
  plan: IHumanActionPlan,
  step: number,
  clock: readonly number[],
): IHumanActionPlan {
  const last: number = clock.length - 1;
  const until: number = last * step;
  if (last < 1) return plan;
  const toPlan = (film: number): number => {
    const at: number = Math.min(last, Math.max(0, film / step));
    const i: number = Math.min(last - 1, Math.floor(at));
    return clock[i]! + (clock[i + 1]! - clock[i]!) * (at - i);
  };

  // The first film second at which the clock has reached a plan second.
  const toFilm = (planned: number): number => {
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
  const moved = (was: number): number => toFilm(was * plan.duration) / until;
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
      (c: IHumanContactWindow): IHumanContactWindow => ({
        ...c,
        from: moved(c.from),
        to: moved(c.to),
      }),
    ),
    ...(plan.contact === undefined ? {} : { contact: toFilm(plan.contact) }),
    posture: (film: number): IHumanPosture => plan.posture(toPlan(film)),
  };
}
