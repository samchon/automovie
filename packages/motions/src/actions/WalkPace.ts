/**
 * The timing of a stepping gait over a distance: its step period, its swing,
 * and how far along its path the pelvis is at each instant.
 *
 * The pelvis gathers its speed over a ramp, cruises one step per period and
 * sheds the speed over a second ramp, each ramp a smooth step of the speed
 * (zero rate and zero rate of rate at both ends). At a heel strike the
 * landing footprint lies `front` steps ahead of the pelvis. A gait with a
 * flight passes over each footprint at that foot's mid-stance, the inverted
 * pendulum of stance (Perry and Burnfield), which puts the landing
 * `1 - swing / 2T` steps ahead; a gait with double support shares the step
 * between the two legs, so the footprint lies no more than half a step ahead.
 * Cruising, the pelvis is `j - front` steps along at heel strike j when the
 * ramp up lasts twice the time from the start to `1 - front` periods before
 * the first heel strike, and it ends over the closing pair when the ramp down
 * lasts `2 (1 - front)` periods.
 *
 * The ramp up lasts longer wherever that would carry the pelvis past the foot
 * left standing at the start, by the time it lifts one period after the first
 * toe-off, further than a cruising stance carries it past its footprint: a
 * leg trails no further at the start than in full stride. The period then
 * lengthens so the cruising speed stays the asked one, and a plan too short
 * for both ramps shrinks them in proportion.
 */
export class WalkPace {
  /** The delay of the first toe-off, seconds: a provisional gait initiation (anticipatory postural adjustments take a few tenths of a second, Brenière, Do and Bouisset 1987). */
  public static readonly FIRST: number = 0.25;

  /** The number of steps to the closing pair. */
  public readonly steps: number;

  /** The step period, seconds. */
  public readonly period: number;

  /** The swing's duration, seconds. */
  public readonly swing: number;

  /** The last heel strike, seconds. */
  public readonly last: number;

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
   * @param props The distance in metres, the number of steps, the asked
   *   speed in m/s, the swing in step periods, and the realised period for a
   *   planned one.
   */
  public constructor(props: WalkPace.IProps & { steps: number }) {
    const first: number = WalkPace.FIRST;
    const n: number = props.steps;
    const base: number = props.period(
      Math.max(props.distance / n, 0.05) / props.speed,
    );
    const front: number = Math.min(0.5, 1 - props.share / 2);

    // The time a cruising stance carries the pelvis past its footprint, in
    // periods: from `front` periods after the heel strike to the toe-off.
    const trail: number = Math.max(0.05, 2 - props.share - front);
    let T: number = base;
    let accel: number = 0;
    let excess: number = 0;
    for (let k: number = 0; k < 8; k++) {
      T = base + excess / (2 * n);
      const formula: number = Math.max(
        1e-3,
        2 * (first + props.share * T - (1 - front) * T),
      );

      // The pelvis's way by the second toe-off, in seconds of cruising.
      const lifts: number = first + T;
      const gone = (a: number): number =>
        a * WalkPace.integral(Math.min(1, lifts / a)) + Math.max(0, lifts - a);
      accel = formula;
      if (gone(formula) > trail * T) {
        let low: number = formula;
        let high: number = formula * 2;
        for (let i: number = 0; i < 20 && gone(high) > trail * T; i++)
          high *= 2;
        for (let i: number = 0; i < 40; i++) {
          const middle: number = (low + high) / 2;
          if (gone(middle) > trail * T) low = middle;
          else high = middle;
        }
        accel = high;
      }
      excess = accel - formula;
    }
    this.steps = n;
    this.period = T;
    this.swing = props.share * T;
    this.front = front;
    this.last = first + this.swing + n * T;

    const decel: number = 2 * (1 - front) * T;
    const ramps: number = Math.min(1, this.last / (accel + decel));
    this.accel = ramps * accel;
    this.decel = ramps * decel;
    this.speed =
      props.distance /
      Math.max(1e-6, this.last - (this.accel + this.decel) / 2);
    this.stride = this.speed * T;
  }

  /**
   * The timing with the fewest steps whose cruising step is no longer than
   * the longest one: at least two steps whenever there is a way to go, one
   * step the whole way being a lunge, the pelvis crossing the distance over a
   * single stance.
   *
   * @param props The distance, the asked speed, the swing and the period law.
   * @param longest The longest step, metres.
   * @returns The timing.
   */
  public static fit(props: WalkPace.IProps, longest: number): WalkPace {
    const least: number = Math.max(
      props.distance < 1e-6 ? 1 : 2,
      Math.ceil(props.distance / longest - 1e-9),
    );
    let pace: WalkPace = new WalkPace({ ...props, steps: least });
    for (
      let extra: number = 1;
      extra <= 4 &&
      props.distance >= 1e-6 &&
      pace.stride > longest * (1 + 1e-6);
      extra++
    )
      pace = new WalkPace({ ...props, steps: least + extra });
    return pace;
  }

  /**
   * How far along its path the pelvis is.
   *
   * @param seconds The instant.
   * @returns Metres from the start, the whole distance from the last heel strike on.
   */
  public progress(seconds: number): number {
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
            WalkPace.integral(
              1 - (t - (this.last - this.decel)) / this.decel,
            ))
        : 0;
    return this.speed * (rise + cruise + fall);
  }

  /** The integral of the smooth step `10 u^3 - 15 u^4 + 6 u^5` from 0 to `u`. */
  private static integral(u: number): number {
    return 2.5 * u ** 4 - 3 * u ** 5 + u ** 6;
  }
}
export namespace WalkPace {
  /** What a timing is planned from. */
  export interface IProps {
    /** The path's length, metres. */
    distance: number;

    /** The asked cruising speed, m/s. */
    speed: number;

    /** The swing's duration in step periods. */
    share: number;

    /** The realised step period for a planned one, seconds. */
    period(seconds: number): number;
  }
}
