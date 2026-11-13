import type { IAutoMovieMotionEvent } from "@automovie/interface";

import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * A stepping plan with its steps taken a little unevenly in time, as a
 * person's are: each step, from one heel strike to the next, lasts its
 * planned time stretched or shrunk by its own small share.
 *
 * A healthy adult's stride time varies by 1 to 3 % from stride to stride
 * (Hausdorff, as the travel family's acceptance cites it), so a gait whose
 * every step lasts exactly as long as the last reads as a machine's. The
 * footprints, the path and the poses are the plan's own: only the film
 * second at which the body passes each of them moves. Within a step the
 * plan's clock runs at `1 + k sin^2(pi u)` of the film's, `u` the share of
 * the step gone, with `k` chosen so the step's planned time is covered in
 * its stretched time. That rate is 1 at every heel strike, so the body's
 * velocity is continuous across them. Before the first strike and after the
 * last the two clocks run alike.
 *
 * @param plan The stepping plan; its heel strikes are the events named `leftHeelStrike<n>` and `rightHeelStrike<n>`.
 * @param stretch The share by which step `index`, from 0, lasts longer than planned; negative for shorter. With the limp's share added, it is held within 0.2 either way.
 * @param limp A limp, when the gait has one: each step standing on the spared leg (the one whose heel strike begins it) is cut short by the share and each step standing on the other drawn out by it.
 * @returns The plan on the uneven clock, with its duration, events, contact windows and decisive instant moved to their film seconds; the plan itself when it names fewer than two heel strikes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what varies and what does not, the source of the variation's size, the clock law and why velocity stays continuous.
 * @evidence contracts/development/implementation.md#principled-implementation A time warp: the pose stays a pure function of the film second, and every named instant is mapped by the same warp, so events, contacts and poses agree. The warp is strictly increasing because `k` is above -1 for a stretch within 0.2.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the strikes, lay out the stretched steps, then two maps, film to plan in closed form and plan to film by bisection.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The 0.2 hold is a guard on the warp's monotonicity, far outside the 1 to 3 % it carries; the size of the variation is the caller's, drawn from the performer's skill and seed.
 * @evidence contracts/development/implementation.md#efficient-algorithms A pose costs one search of the steps and a closed-form map; a named instant costs a 40-step bisection, once per plan.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to cache beyond the step table built once per plan.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Holds the plan and the step table for as long as the returned plan is held.
 */
export function walkTempo(
  plan: IHumanActionPlan,
  stretch: (index: number) => number,
  limp?: { side: "left" | "right"; share: number },
): IHumanActionPlan {
  const struck: { seconds: number; side: "left" | "right" }[] = plan.events
    .filter((e: IAutoMovieMotionEvent): boolean =>
      /HeelStrike\d+$/.test(e.name),
    )
    .map(
      (
        e: IAutoMovieMotionEvent,
      ): { seconds: number; side: "left" | "right" } => ({
        seconds: e.share * plan.duration,
        side: e.name.startsWith("left") ? "left" : "right",
      }),
    )
    .sort(
      (a: { seconds: number }, b: { seconds: number }): number =>
        a.seconds - b.seconds,
    );
  const strikes: number[] = struck.map(
    (s: { seconds: number }): number => s.seconds,
  );
  if (strikes.length < 2) return plan;

  // Each step's planned span, its stretched span on the film's clock and the rate's amplitude that covers one in the other.
  const steps: { plan: number; film: number; planned: number; lasts: number }[] =
    [];
  let film: number = strikes[0]!;
  for (let i: number = 0; i + 1 < strikes.length; ++i) {
    const planned: number = strikes[i + 1]! - strikes[i]!;
    const lasts: number =
      planned *
      (1 +
        Math.max(
          -0.2,
          Math.min(
            0.2,
            stretch(i) +
              (limp === undefined
                ? 0
                : struck[i]!.side === limp.side
                  ? -limp.share
                  : limp.share),
          ),
        ));
    steps.push({ plan: strikes[i]!, film, planned, lasts });
    film += lasts;
  }
  const end: { plan: number; film: number } = {
    plan: strikes[strikes.length - 1]!,
    film,
  };

  // The plan's seconds gone at a share of a step: the integral of the rate.
  const gone = (
    step: { planned: number; lasts: number },
    u: number,
  ): number =>
    step.lasts *
    (u +
      2 *
        (step.planned / step.lasts - 1) *
        (u / 2 - Math.sin(2 * Math.PI * u) / (4 * Math.PI)));

  // The step a second falls in, on either clock: the last one that has begun.
  const within = (clock: "plan" | "film", seconds: number): number => {
    let index: number = 0;
    for (let i: number = 1; i < steps.length; ++i)
      if (steps[i]![clock] <= seconds) index = i;
    return index;
  };
  const toPlan = (seconds: number): number => {
    if (seconds <= steps[0]!.film) return seconds;
    if (seconds >= end.film) return end.plan + (seconds - end.film);
    const step: { plan: number; film: number; planned: number; lasts: number } =
      steps[within("film", seconds)]!;
    return step.plan + gone(step, (seconds - step.film) / step.lasts);
  };
  const toFilm = (seconds: number): number => {
    if (seconds <= steps[0]!.plan) return seconds;
    if (seconds >= end.plan) return end.film + (seconds - end.plan);
    const step: { plan: number; film: number; planned: number; lasts: number } =
      steps[within("plan", seconds)]!;
    let low: number = 0;
    let high: number = 1;
    for (let i: number = 0; i < 40; ++i) {
      const middle: number = (low + high) / 2;
      if (step.plan + gone(step, middle) < seconds) low = middle;
      else high = middle;
    }
    return step.film + ((low + high) / 2) * step.lasts;
  };
  const duration: number = toFilm(plan.duration);
  const share = (was: number): number => toFilm(was * plan.duration) / duration;
  return {
    ...plan,
    duration,
    events: plan.events.map(
      (e: IAutoMovieMotionEvent): IAutoMovieMotionEvent => ({
        ...e,
        share: share(e.share),
      }),
    ),
    contacts: plan.contacts.map(
      (c: IHumanContactWindow): IHumanContactWindow => ({
        ...c,
        from: share(c.from),
        to: share(c.to),
      }),
    ),
    ...(plan.contact === undefined ? {} : { contact: toFilm(plan.contact) }),
    posture: (seconds: number): IHumanPosture =>
      plan.posture(toPlan(Math.min(duration, Math.max(0, seconds)))),
  };
}
