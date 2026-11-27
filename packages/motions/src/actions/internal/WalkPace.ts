import type { IAutoMovieMotionHumanWalkPace } from "@automovie/interface";

/**
 * The timing of a stepping gait over a distance: its step period, its swing,
 * and how far along its path the pelvis is at each instant.
 *
 * With a cruising walking step between departure and arrival, the first
 * accelerating steps absorb the part of the distance left by the whole cruising
 * steps. The cruise can retain both its step and its cadence.
 *
 * The pelvis gathers its speed over a ramp, from rest or from the speed the
 * gait is entered at (`IProps.entrySpeed`), cruises one step per period and
 * sheds the speed over a second ramp, each ramp a smooth step of the speed
 * (zero rate and zero rate of rate at both ends). At a heel strike the landing
 * footprint lies `front` steps ahead of the pelvis. A gait with a flight passes
 * at a foot's mid-stance over the middle of the way its centre of pressure
 * travels, from the heel to the ball: the spring-mass leg of running is
 * symmetric about its contact (Blickhan 1989, J Biomech 22:1217), so the leg
 * lands as far ahead of that contact as it leaves it behind. That puts the
 * landing `1 - swing / 2T` steps ahead less the `lead` the middle lies ahead of
 * the ankle; a gait with double support shares the step between the two legs,
 * so the footprint lies no more than half a step ahead. Cruising, the pelvis is
 * `j - front` steps along at heel strike j when the ramp up lasts twice the
 * time from the start to `1 - front` periods before the first heel strike, and
 * it ends over the closing pair when the ramp down lasts `2 (1 - front)`
 * periods.
 *
 * The ramp up lasts longer wherever that would carry the pelvis past the foot
 * left standing at the start, by the time it lifts one period after the first
 * toe-off, further than a cruising stance carries it past its footprint: a leg
 * trails no further at the start than in full stride. The period then lengthens
 * so the longer ramp does not quicken the cruise, and a plan too short for both
 * ramps shrinks them in proportion.
 *
 * A walk whose way is set from outside (`IProps.travel`, a cadenced station)
 * keeps the asked period and as many steps as the way takes to be gone, and its
 * pelvis is where the way says: each step is then as long as the way gone in
 * it, as a drilled soldier keeps his place at a called cadence by the length of
 * his step.
 */
export class WalkPace {
  /**
   * The delay of the first toe-off, seconds: a provisional gait initiation
   * (anticipatory postural adjustments take a few tenths of a second, Brenière,
   * Do and Bouisset 1987).
   */
  public static readonly FIRST: number = 0.25;

  /**
   * The longest a walk is planned for, seconds: ten minutes, which no shot
   * reaches; a way set from outside is searched no further for its end, and no
   * step count is sought past it.
   */
  public static readonly LONGEST: number = 600;

  /**
   * A numeric floor on the step, metres, and on the front and trail shares,
   * steps: it keeps the period and the shares positive and finite for a
   * vanishing step, and lies under any value a gait produces (a walk's front is
   * half a step, a step tens of centimetres).
   */
  public static readonly FLOOR: number = 0.05;

  /**
   * A numeric floor on the ramp up's formula, seconds, keeping it positive
   * where the gait's first swing would end before its first heel strike's lead;
   * a millisecond, under a film frame.
   */
  public static readonly SHORTEST_RAMP: number = 1e-3;

  /**
   * The most passes of the period's fixed point: at a contraction of a quarter
   * or less each, 64 passes leave 2^-128 of the first error.
   */
  public static readonly PASSES: number = 64;

  /**
   * The period change, seconds, under which the period's fixed point is
   * settled: a nanosecond, far under a film frame.
   */
  public static readonly SETTLED: number = 1e-9;

  /**
   * The most doublings of the ramp's bracket: 2^20 times the formula's ramp,
   * past any ramp a plan of `LONGEST` holds.
   */
  public static readonly DOUBLINGS: number = 20;

  /** The number of steps to the closing pair. */
  public readonly steps: number;

  /** The step period, seconds. */
  public readonly period: number;

  /** The swing's duration, seconds. */
  public readonly swing: number;

  /** The last heel strike, seconds. */
  public readonly last: number;

  /**
   * The first toe-off, seconds: a standing start's initiation (`FIRST`), or,
   * for a gait entered in stride (`IProps.stride`), a period less a swing less
   * the time the standing foot has stood, so the foot in the air lands one
   * period after the standing foot's stance began.
   */
  public readonly first: number;

  /** How far ahead of the pelvis a landing footprint lies, steps. */
  public readonly front: number;

  /** The cruising step, metres. */
  public readonly stride: number;

  /** The ramp up, seconds. */
  private readonly accel: number;

  /** The ramp down, seconds. */
  private readonly decel: number;

  /** The cruising speed, m/s. */
  private readonly speed: number;

  /**
   * The pelvis's speed along the way at the start, m/s: the ramp up starts from
   * it.
   */
  private readonly entry: number;

  /** The path's length, metres. */
  private readonly distance: number;

  /** The share of the way gone at a second, when the way is set from outside. */
  private readonly travel: ((seconds: number) => number) | undefined;

  /**
   * @param props The distance in metres, the number of steps, the longest step
   *   in metres, the asked speed in m/s, the swing in step periods, and the
   *   realised period for a planned one.
   */
  public constructor(
    props: IAutoMovieMotionHumanWalkPace.IProps & IWalkPaceProps,
  ) {
    // The first toe-off at a period: a standing start's initiation, or a
    // gait in stride's next footfall one period after the standing foot's
    // stance began, `stride` seconds before the start.
    const opening = (period: number): number =>
      props.firstPlant !== undefined
        ? props.firstPlant - period * props.share
        : props.stride === undefined
          ? WalkPace.FIRST
          : period * (1 - props.share) - props.stride;
    const n: number = props.steps;
    const floor: number = WalkPace.FLOOR;
    const base: number = props.period(
      Math.max(props.longest, floor) / props.speed,
    );
    const front: number =
      props.share > 1
        ? Math.max(
            floor,
            1 -
              props.share / 2 -
              (props.lead ?? 0) / Math.max(props.distance / n, floor),
          )
        : Math.min(0.5, 1 - props.share / 2);

    // The time a cruising stance carries the pelvis past its footprint, in
    // periods: from `front` periods after the heel strike to the toe-off.
    const trail: number = Math.max(floor, 2 - props.share - front);

    // The ramp up and the period depend on each other: the period lengthens
    // by the ramp's excess over its formula, shared over the 2n half-ramps
    // of cruising, and the excess is read at that period. The excess grows
    // with the period at about the ramp's own rate, so one pass shrinks a
    // period error by about 1 / (2n), a quarter at two steps; the passes run
    // until the period moves by less than `SETTLED`, `PASSES` bounding them.
    // A fixed-cadence way or an unchanged base period has no next iterate.
    const fixedCadence: boolean = props.travel !== undefined;
    let T: number = base;
    let accel: number = 0;
    let excess: number = 0;
    for (let k: number = 0; k < WalkPace.PASSES; k++) {
      // A way set from outside keeps the asked period: its pelvis does not ramp by itself.
      const was: number = T;
      T = base + (fixedCadence ? 0 : excess / (2 * n));
      const first: number = opening(T);
      const formula: number = Math.max(
        WalkPace.SHORTEST_RAMP,
        2 * (first + props.share * T - (1 - front) * T),
      );

      // The pelvis's way by the second toe-off, in seconds of cruising.
      const lifts: number = first + T;
      const gone: (a: number) => number = (a: number): number =>
        a * WalkPace.integral(Math.min(1, lifts / a)) + Math.max(0, lifts - a);
      accel = formula;
      if (gone(formula) > trail * T) {
        // `gone` falls as the ramp lengthens: double the ramp until it no
        // longer carries the pelvis past the trail, then bisect, 40 halvings
        // leaving 2^-40 of the bracket.
        let low: number = formula;
        let high: number = formula * 2;
        for (
          let i: number = 0;
          i < WalkPace.DOUBLINGS && gone(high) > trail * T;
          i++
        )
          high *= 2;
        for (let i: number = 0; i < 40; i++) {
          const middle: number = (low + high) / 2;
          if (gone(middle) > trail * T) low = middle;
          else high = middle;
        }
        accel = high;
      }
      excess = accel - formula;
      if (
        fixedCadence ||
        (T === base && excess === 0) ||
        (k > 0 && Math.abs(T - was) < WalkPace.SETTLED)
      )
        break;
    }
    this.steps = n;
    this.period = T;
    this.swing = props.share * T;
    this.front = front;
    this.first = opening(T);
    this.last = this.first + this.swing + n * T;

    const decel: number = 2 * (1 - front) * T;
    // Both speed ramps integrate to half their duration. Solve the
    // remaining departure duration from D = v (last - (accel + decel)/2)
    // with v = step/T, respecting the opening leg's existing reach bound.
    if (!fixedCadence && props.share < 1 && props.distance > floor && n > 2)
      accel = Math.max(
        accel,
        2 * (this.last - (props.distance * T) / props.longest) - decel,
      );
    const ramps: number = Math.min(1, this.last / (accel + decel));
    this.accel = ramps * accel;
    this.decel = ramps * decel;

    // A gait entered moving ramps from its entry speed v0 instead of rest:
    // the ramp up then covers v0 accel / 2 beyond its smooth step's half,
    // so D = v (last - (accel + decel) / 2) + v0 accel / 2.
    this.entry =
      fixedCadence || !(props.distance > floor)
        ? 0
        : Math.max(0, props.entrySpeed ?? 0);
    this.speed =
      (props.distance - (this.entry * this.accel) / 2) /
      Math.max(1e-6, this.last - (this.accel + this.decel) / 2);
    this.stride = this.speed * T;
    this.distance = props.distance;
    this.travel = props.travel;
  }

  /**
   * The timing with the fewest steps whose cruising step is no longer than the
   * longest one: at least two steps whenever there is a way to go, one step the
   * whole way being a lunge, the pelvis crossing the distance over a single
   * stance.
   *
   * @param props The distance, the asked speed, the swing and the period law.
   * @param longest The longest step, metres.
   * @returns The timing.
   */
  public static fit(
    props: IAutoMovieMotionHumanWalkPace.IProps,
    longest: number,
  ): WalkPace {
    if (props.travel !== undefined && props.distance >= 1e-6)
      return WalkPace.travelled(props, props.travel, longest);
    const least: number = Math.max(
      props.distance < 1e-6 ? 1 : 2,
      Math.ceil(props.distance / longest - 1e-9),
    );

    // The cruising step is `D / (n - E)`, `E` the steps the ramps' excess
    // over their formula costs (`excess / 2T`), which settles as `n` grows;
    // each added step lowers it until it is no longer than the longest. A
    // plan that would take longer than `LONGEST` to get there is refused.
    let pace: WalkPace = new WalkPace({ ...props, steps: least, longest });
    for (
      let steps: number = least + 1;
      props.distance >= 1e-6 && pace.stride > longest * (1 + 1e-6);
      steps++
    ) {
      if (pace.last > WalkPace.LONGEST)
        throw new Error(
          `A walk of ${props.distance.toFixed(3)} m finds no step count whose cruising step is at most ${longest.toFixed(3)} m within ${WalkPace.LONGEST} s`,
        );
      pace = new WalkPace({ ...props, steps, longest });
    }
    return pace;
  }

  /**
   * How far along its path the pelvis is.
   *
   * @param seconds The instant.
   * @returns Metres from the start, the whole distance from the last heel
   *   strike on.
   */
  public progress(seconds: number): number {
    if (this.travel !== undefined)
      return seconds >= this.last
        ? this.distance
        : this.distance * Math.min(1, this.travel(Math.max(0, seconds)));
    const t: number = Math.min(this.last, Math.max(0, seconds));
    const rise: number =
      this.accel * WalkPace.integral(Math.min(1, t / this.accel));
    const cruise: number = Math.max(
      0,
      Math.min(t, this.last - this.decel) - this.accel,
    );
    const fall: number =
      t > this.last - this.decel
        ? this.decel *
          (0.5 -
            WalkPace.integral(1 - (t - (this.last - this.decel)) / this.decel))
        : 0;
    // The ramp up blends the entry speed into the cruise by the same smooth
    // step: v(t) = v0 + (v - v0) step(t / accel), so the entry speed adds
    // v0 (t - rise) while it lasts.
    const carried: number = this.entry * (Math.min(t, this.accel) - rise);
    return this.speed * (rise + cruise + fall) + carried;
  }

  /**
   * The timing of a way set from outside: the asked period, and the fewest
   * steps, at least two, whose closing heel strike comes once the whole way is
   * gone. The second the way is gone is found by bisection on the share, which
   * never falls: 50 halvings of a bracket of at most `LONGEST` leave under a
   * nanosecond.
   *
   * @param props The distance, the asked speed, the swing and the period law.
   * @param travel The share of the way gone at a second of the plan.
   * @param longest The longest step, metres.
   * @returns The timing.
   */
  private static travelled(
    props: IAutoMovieMotionHumanWalkPace.IProps,
    travel: (seconds: number) => number,
    longest: number,
  ): WalkPace {
    const T: number = props.period(
      Math.max(longest, WalkPace.FLOOR) / props.speed,
    );
    let low: number = 0;
    let high: number = 1;
    while (travel(high) < 1 - 1e-9 && high < WalkPace.LONGEST) high *= 2;
    for (let i: number = 0; i < 50; i++) {
      const middle: number = (low + high) / 2;
      if (travel(middle) < 1 - 1e-9) low = middle;
      else high = middle;
    }
    const steps: number = Math.max(
      2,
      Math.ceil((high - WalkPace.FIRST - props.share * T) / T - 1e-9),
    );
    return new WalkPace({ ...props, steps, longest });
  }

  /** The integral of the smooth step `10 u^3 - 15 u^4 + 6 u^5` from 0 to `u`. */
  private static integral(u: number): number {
    return 2.5 * u ** 4 - 3 * u ** 5 + u ** 6;
  }
}

/** The record of `IWalkPaceProps`'s site. */
type IWalkPaceProps = {
  steps: number;
  longest: number;
};
