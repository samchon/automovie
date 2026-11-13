import type { IAutoMovieMotionEvent } from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * A stepping plan walked at another's pace: the body is as far along its
 * own way, as a share of it, as a leader is along theirs, so it sets off
 * when they do, slows where they slow, stands while they stand and arrives
 * when they arrive.
 *
 * The plan's footprints, path and poses are its own; only the film second
 * at which the body passes each of them follows the leader. A follower
 * whose way is about as long as the leader's therefore keeps the gap it
 * started with until the leader stops, where a walk at its own pace would
 * close or open it (followers match a leader's speed; Rio, Rhea and Warren
 * 2014, J Vis 14(2):4). First pass: the share is matched instant for
 * instant, with no visual-motor delay and no gain.
 *
 * The plan's way is read as the length its root travels, at `SAMPLES`
 * instants. A leader who would take the body along its way faster than
 * `FASTEST` times the plan's own pace on average is refused.
 *
 * @param plan The stepping plan at its own pace.
 * @param share The leader's share of their way, 0 to 1 and never falling, at a second counted from the plan's start.
 * @param until The second, counted from the plan's start, at which the leader's share reaches 1.
 * @returns The plan at the leader's pace, ending at `until`, with its events and contact windows moved to their film seconds.
 * @throws {HumanRefusal} When the leader's pace is beyond `FASTEST` times the plan's.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is matched, what stays the plan's own, the source of the behaviour, what the first pass omits and the refusal.
 * @evidence contracts/development/implementation.md#principled-implementation A time warp through arc length: the pose stays a pure function of the film second, and every named instant is mapped by the same warp, so events, contacts and poses agree. The warp never runs backwards because both shares never fall.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Tabulate the plan's way, map a film second to the plan second of equal share, and invert that map by bisection for the named instants.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A pace the gait cannot keep is refused with the factor, never clamped; `FASTEST` and `SAMPLES` are named and provisional.
 * @evidence contracts/development/implementation.md#efficient-algorithms Planning reads `SAMPLES` postures of the plan once; a pose costs one table search, a named instant a 40-step bisection.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to cache beyond the table built once per plan.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Holds the plan and the table for as long as the returned plan is held.
 */
export function walkPaced(
  plan: IHumanActionPlan,
  share: (seconds: number) => number,
  until: number,
): IHumanActionPlan {
  if (!(until > 0) || plan.duration / until > walkPaced.FASTEST)
    throw new HumanRefusal({
      kind: "reach",
      axis: "pace",
      value: until > 0 ? plan.duration / until : null,
      feasible: {
        kind: "range",
        minimum: 0,
        maximum: walkPaced.FASTEST,
        unit: "",
      },
      reason: `keeping the leader's pace would take this way ${until > 0 ? (plan.duration / until).toFixed(2) : "infinitely"} times faster than the gait walks it`,
      fix: "follow at a faster pace, start nearer, or chase instead of following",
    });

  // The plan's own share of its way at each of its sampled seconds: the length its root has travelled over the whole length.
  const seconds: number[] = [];
  const lengths: number[] = [];
  let before: IHumanPosture["root"] = plan.posture(0).root;
  for (let i: number = 0; i <= walkPaced.SAMPLES; ++i) {
    const t: number = (i / walkPaced.SAMPLES) * plan.duration;
    const now: IHumanPosture["root"] = plan.posture(t).root;
    seconds.push(t);
    lengths.push(
      (lengths[i - 1] ?? 0) + Math.hypot(now.x - before.x, now.z - before.z),
    );
    before = now;
  }
  const whole: number = lengths[lengths.length - 1]!;
  const toPlan = (film: number): number => {
    if (film >= until || whole < 1e-9) return film >= until ? plan.duration : 0;
    const wanted: number = Math.min(1, Math.max(0, share(film))) * whole;
    let i: number = 1;
    while (i < lengths.length - 1 && lengths[i]! < wanted) ++i;
    const span: number = lengths[i]! - lengths[i - 1]!;
    return (
      seconds[i - 1]! +
      (span < 1e-12 ? 0 : (wanted - lengths[i - 1]!) / span) *
        (seconds[i]! - seconds[i - 1]!)
    );
  };

  // The first film second at which the plan has reached one of its own seconds.
  const toFilm = (planned: number): number => {
    let low: number = 0;
    let high: number = until;
    for (let i: number = 0; i < 40; ++i) {
      const middle: number = (low + high) / 2;
      if (toPlan(middle) < planned) low = middle;
      else high = middle;
    }
    return high;
  };
  const moved = (was: number): number =>
    was <= 1e-12 ? 0 : toFilm(was * plan.duration) / until;
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
    posture: (film: number): IHumanPosture =>
      plan.posture(toPlan(Math.min(until, Math.max(0, film)))),
  };
}

/**
 * Constants of {@link walkPaced}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each constant states its unit and that it is provisional.
 * @evidence contracts/development/design.md#principled-representation A dimensionless factor and a count.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two numbers the function reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Named and marked, not numbers inside the function.
 */
export namespace walkPaced {
  /** The most a leader's pace may speed the plan up on average, as a factor of its own pace (provisional: beyond it a walk would have to become a run). */
  export const FASTEST: number = 1.5;

  /** Instants of the plan at which its way is read (provisional: a step is read several times over). */
  export const SAMPLES: number = 80;
}
