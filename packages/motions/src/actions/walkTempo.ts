import type {
  AutoMovieHumanSide,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import type { walkStation } from "./walkStation";

/** The record of `IWalkTempoLimp`'s site. */
type IWalkTempoLimp = { side: AutoMovieHumanSide; share: number };

/**
 * A stepping plan with its steps taken a little unevenly in time, as a person's
 * are: each step, from one heel strike to the next, lasts its planned time
 * stretched or shrunk by its own small share.
 *
 * A healthy adult's stride time varies by 1 to 3 % from stride to stride
 * (Hausdorff, as the travel family's acceptance cites it), so a gait whose
 * every step lasts exactly as long as the last reads as a machine's. The
 * footprints, the path and the poses are the plan's own: only the film second
 * at which the body passes each of them moves. Within a step the plan's clock
 * runs at `1 + k sin^2(pi u)` of the film's, `u` the share of the step gone,
 * with `k` chosen so the step's planned time is covered in its stretched time.
 * That rate is 1 at every heel strike, so the body's velocity is continuous
 * across them. Before the first strike and after the last the two clocks run
 * alike.
 *
 * @param plan The stepping plan; its heel strikes are the events named
 *   `leftHeelStrike<n>` and `rightHeelStrike<n>`.
 * @param stretch The share by which step `index`, from 0, lasts longer than
 *   planned; negative for shorter. With the limp's share added, it is held
 *   within `walkTempo.HOLD` either way.
 * @param limp A limp, when the gait has one: each step standing on the spared
 *   leg (the one whose heel strike begins it) is cut short by the share and
 *   each step standing on the other drawn out by it.
 * @returns The plan on the uneven clock, with its duration, events, contact
 *   windows and decisive instant moved to their film seconds; the plan itself
 *   when it names fewer than two heel strikes.
 */
export function walkTempo(
  plan: walkStation.IPlan,
  stretch: (index: number) => number,
  limp?: IWalkTempoLimp,
): walkStation.IPlan {
  return warped(
    plan,
    (index: number, planned: number, side: AutoMovieHumanSide): number =>
      planned *
      (1 +
        Math.max(
          -walkTempo.HOLD,
          Math.min(
            walkTempo.HOLD,
            stretch(index) +
              (limp === undefined
                ? 0
                : side === limp.side
                  ? -limp.share
                  : limp.share),
          ),
        )),
  );
}

/**
 * The heel strikes a stepping plan names and the time warp that sends them to
 * given seconds, companions of {@link walkTempo}.
 */
export namespace walkTempo {
  /**
   * The most a drawn variability stretches or shrinks a step's planned time,
   * and the most a beat's period may differ from the gait's own step, as a
   * share of it: beyond it the gait the footprints were planned at no longer
   * describes the steps. A fifth either way spans the paced tempi walkers
   * synchronise their steps to: 22.5 % faster than the preferred step rate
   * (Leow, Parrott and Grahn 2014, Front Hum Neurosci 8:811, metronome and
   * music cueing) and 0.9 to 1.1 of it (Brain Sci 2020, 10:273); its symmetric
   * rounding is provisional. A single entrained step may depart further while
   * phase correction draws its strike onto a beat; the warp stays increasing up
   * to a step twice its planned time.
   */
  export const HOLD: number = 0.2;

  /** A heel strike of a plan. */
  export interface IStrike {
    /** Seconds of the plan. */
    seconds: number;

    /** The striking foot. */
    side: AutoMovieHumanSide;
  }
  /** The alternatives of `WalkTempoStrikesPlan`'s site. */
  type WalkTempoStrikesPlan = "duration" | "events";

  /**
   * The heel strikes a plan names (`leftHeelStrike<n>`, `rightHeelStrike<n>`),
   * in time order.
   *
   * @param plan The stepping plan.
   * @returns Its strikes.
   */
  export function strikes(
    plan: Pick<IAutoMovieMotionHumanActionPlan, WalkTempoStrikesPlan>,
  ): IStrike[] {
    return plan.events
      .filter((e: IAutoMovieMotionEvent): boolean =>
        /HeelStrike\d+$/.test(e.name),
      )
      .map(
        (e: IAutoMovieMotionEvent): IStrike => ({
          seconds: e.share * plan.duration,
          side: e.name.startsWith("left") ? "left" : "right",
        }),
      )
      .sort((a: IStrike, b: IStrike): number => a.seconds - b.seconds);
  }

  /** The two directions of the same continuous gait clock. */
  export interface IClock {
    /** Convert film-local seconds to stepping-plan seconds. */
    toPlan: (seconds: number) => number;

    /** Convert stepping-plan seconds to film-local seconds. */
    toFilm: (seconds: number) => number;
  }

  /**
   * Prepare the entrained clock before playback or footprint placement. The
   * first strike retains its original time. Each subsequent step takes the
   * interval between its supplied strikes, with a rate of one at either
   * boundary so velocities agree across steps.
   *
   * @param planned The nominal sequence of heel strikes.
   * @param seconds Their entrained film-local seconds. If an endpoint has no
   *   given time, keep the planned step.
   * @returns Both maps of the clock, or nothing for fewer than two strikes.
   * @throws {Error} When an entrained interval is at most zero or at least
   *   twice the planned interval; the warp would stop or reverse.
   */
  export function entrainment(
    planned: readonly IStrike[],
    seconds: readonly number[],
  ): IClock | undefined {
    return makeClock(planned, (index: number, planned: number): number => {
      const given: number | undefined = seconds[index + 1];
      const before: number | undefined = seconds[index];
      if (given === undefined || before === undefined) return planned;
      const lasts: number = given - before;
      if (!(lasts > 0 && lasts < 2 * planned))
        throw new Error(
          `An entrained step of ${lasts.toFixed(3)} s cannot carry its planned ${planned.toFixed(3)} s without running backwards`,
        );
      return lasts;
    });
  }

  /**
   * Play an action and its contact windows through a previously prepared clock.
   *
   * @param plan The action on the stepping clock.
   * @param clock The same clock used to place its footprints.
   * @returns The action on the film clock.
   */
  export function playback(
    plan: walkStation.IPlan,
    clock: IClock,
  ): walkStation.IPlan {
    return retime(plan, clock);
  }
}

/**
 * The warp shared by the drawn and the entrained clocks.
 *
 * @param plan The stepping plan.
 * @param length Each step's film seconds from its index, its planned seconds
 *   and the foot whose strike begins it; above zero and under twice the planned
 *   seconds.
 * @returns The plan on the warped clock, or the plan itself when it names fewer
 *   than two heel strikes.
 */
function warped(
  plan: walkStation.IPlan,
  length: (index: number, planned: number, side: AutoMovieHumanSide) => number,
): walkStation.IPlan {
  const clock: walkTempo.IClock | undefined = makeClock(
    walkTempo.strikes(plan),
    length,
  );
  return clock === undefined ? plan : retime(plan, clock);
}
/** The alternatives of `MakeClockWithinClock2`'s site. */
type MakeClockWithinClock2 = "plan" | "film";

/** The alternatives of `MakeClockWithinClock`'s site. */
type MakeClockWithinClock = "plan" | "film";

/** The record of `IMakeClockGoneStep2`'s site. */
type IMakeClockGoneStep2 = { amplitude: number; lasts: number };

/** The record of `IMakeClockGoneStep`'s site. */
type IMakeClockGoneStep = { amplitude: number; lasts: number };

/** The record of `IMakeClockEnd`'s site. */
type IMakeClockEnd = { plan: number; film: number };

/** The record of `IMakeClockStepsItem`'s site. */
type IMakeClockStepsItem = {
  plan: number;
  film: number;
  amplitude: number;
  lasts: number;
};

/** The record of `IMakeClockStrikesS`'s site. */
type IMakeClockStrikesS = { seconds: number };

/** Prepare the monotone two-way clock over a sequence of heel strikes. */
function makeClock(
  struck: readonly walkTempo.IStrike[],
  length: (index: number, planned: number, side: AutoMovieHumanSide) => number,
): walkTempo.IClock | undefined {
  const strikes: number[] = struck.map(
    (s: IMakeClockStrikesS): number => s.seconds,
  );
  if (strikes.length < 2) return undefined;

  // Each step's planned span, its stretched span on the film's clock and the rate's amplitude that covers one in the other: the rate `1 + k sin^2(pi u)` integrates to `1 + k / 2` over a step, so `k = 2 (planned / lasts - 1)`.
  const steps: IMakeClockStepsItem[] = [];
  let film: number = strikes[0]!;
  for (let i: number = 0; i + 1 < strikes.length; ++i) {
    const planned: number = strikes[i + 1]! - strikes[i]!;
    const lasts: number = length(i, planned, struck[i]!.side);
    steps.push({
      plan: strikes[i]!,
      film,
      amplitude: 2 * (planned / lasts - 1),
      lasts,
    });
    film += lasts;
  }
  const end: IMakeClockEnd = {
    plan: strikes[strikes.length - 1]!,
    film,
  };

  // The plan's seconds gone at a share of a step: the integral of the rate.
  const gone: (step: IMakeClockGoneStep, u: number) => number = (
    step: IMakeClockGoneStep2,
    u: number,
  ): number =>
    step.lasts *
    (u + step.amplitude * (u / 2 - Math.sin(2 * Math.PI * u) / (4 * Math.PI)));

  // The step a second falls in, on either clock: the last one that has begun.
  const within: (clock: MakeClockWithinClock, seconds: number) => number = (
    clock: MakeClockWithinClock2,
    seconds: number,
  ): number => {
    let index: number = 0;
    let high: number = steps.length - 1;
    while (index < high) {
      const middle: number = (index + high + 1) >>> 1;
      if (steps[middle]![clock] <= seconds) index = middle;
      else high = middle - 1;
    }
    return index;
  };
  const toPlan: (seconds: number) => number = (seconds: number): number => {
    if (seconds <= steps[0]!.film) return seconds;
    if (seconds >= end.film) return end.plan + (seconds - end.film);
    const step: (typeof steps)[number] = steps[within("film", seconds)]!;
    return step.plan + gone(step, (seconds - step.film) / step.lasts);
  };

  // Plan to film by bisection on the step's share: 40 halvings leave 2^-40 of a step, far under a microsecond.
  const toFilm: (seconds: number) => number = (seconds: number): number => {
    if (seconds <= steps[0]!.plan) return seconds;
    if (seconds >= end.plan) return end.film + (seconds - end.plan);
    const step: (typeof steps)[number] = steps[within("plan", seconds)]!;
    let low: number = 0;
    let high: number = 1;
    for (let i: number = 0; i < 40; ++i) {
      const middle: number = (low + high) / 2;
      if (step.plan + gone(step, middle) < seconds) low = middle;
      else high = middle;
    }
    return step.film + ((low + high) / 2) * step.lasts;
  };
  return { toPlan, toFilm };
}

/** Send the pose, events and contacts through the same clock. */
function retime(
  plan: walkStation.IPlan,
  clock: walkTempo.IClock,
): walkStation.IPlan {
  const { toPlan, toFilm }: walkTempo.IClock = clock;
  const duration: number = toFilm(plan.duration);
  const share: (was: number) => number = (was: number): number =>
    toFilm(was * plan.duration) / duration;
  const source: walkStation.HorizontalRoot | undefined = plan.horizontalRoot;
  const sourceTime: (seconds: number) => number = (seconds: number): number =>
    toPlan(Math.min(duration, Math.max(0, seconds)));
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
      (
        c: IAutoMovieMotionHumanContactWindow,
      ): IAutoMovieMotionHumanContactWindow => ({
        ...c,
        from: share(c.from),
        to: share(c.to),
      }),
    ),
    ...(plan.contact === undefined ? {} : { contact: toFilm(plan.contact) }),
    ...(source === undefined
      ? {}
      : {
          horizontalRoot: (seconds: number): walkStation.HorizontalPoint =>
            source(sourceTime(seconds)),
        }),
    posture: (
      seconds: number,
      channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): IAutoMovieMotionHumanPosture =>
      plan.posture(sourceTime(seconds), channels, resolution, projection),
  };
}
