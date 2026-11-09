import { Vector3, type superposeMinimumJerk } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * How a strike follows its target: the goal planned at the launch from where
 * the target is predicted to be at contact, and then online corrections, each
 * a minimum-jerk unit superposed on the strike's goal, as the target is seen
 * to move.
 *
 * A performer observes the target every film frame from the launch. Each
 * observation predicts the target's point at contact by extrapolating its
 * current velocity (a first-order prediction, the simplest model of
 * interception of moving targets; Brenner and Smeets 1996), and the change
 * of that prediction since the previous observation is added to the goal by a
 * new minimum-jerk unit that starts one visuomotor correction latency after
 * the observation and ends at the contact (Flash and Henis 1991: a second unit
 * superposed on the first, not an aborted and re-planned movement; latency
 * 0.11 s, Prablanc and Martin 1992). Observations stop once a correction could
 * no longer run for its shortest duration before contact, so a target that
 * starts moving later than that is not followed: the strike lands on the line
 * it committed to, which is how a well-timed slip makes a punch miss, and why
 * a kick that commits at its chamber key (about one latency before impact)
 * sweeps through where the target was.
 *
 * A stationary target gives zero corrections and the planned goal unchanged;
 * a target moving at constant velocity is met exactly, because each
 * prediction is then exact.
 */
export namespace StrikingAim {
  /** The timing of one strike's tracking, film seconds. */
  export interface ITiming {
    /** The launch, film seconds. */
    launch: number;

    /** The contact, film seconds; after the launch. */
    impact: number;

    /** The visuomotor correction latency, seconds. */
    latency: number;

    /** The observation period, seconds: one film frame. */
    step: number;

    /** The shortest correction unit, seconds. */
    shortest: number;
  }

  /** One strike's tracking state, evaluated causally. */
  export interface ITracker {
    /** The goal predicted at the launch, world metres. */
    planned: IAutoMovieVector3;

    /**
     * The correction units that have started by a second, in observation
     * order; each reads observations only at or before its own start minus the
     * latency, so evaluating it never looks ahead of `seconds`.
     *
     * @param seconds Film seconds.
     * @returns The units, start and duration in film seconds.
     */
    units(seconds: number): readonly superposeMinimumJerk.IUnit[];

    /**
     * The goal including every correction that has started by a second.
     *
     * @param seconds Film seconds.
     * @returns World metres.
     */
    goal(seconds: number): IAutoMovieVector3;
  }

  /**
   * The observation seconds of a strike: from the launch, one per step, up to
   * the last one whose correction still lasts its shortest duration.
   *
   * @param timing The timing.
   * @returns Film seconds, ascending, the launch first.
   */
  export function observations(timing: ITiming): number[] {
    if (!(timing.impact > timing.launch)) throw new Error("A strike's contact comes after its launch");
    const last: number = timing.impact - timing.latency - timing.shortest;
    const out: number[] = [timing.launch];
    for (let k: number = 1; ; k++) {
      const t: number = timing.launch + k * timing.step;
      if (t > last + 1e-9) break;
      out.push(t);
    }
    return out;
  }

  /**
   * The target's point predicted at contact from one observation: its point
   * then plus its velocity (a backward difference over one step) times the
   * time left.
   *
   * @param aim The target's point at a film second.
   * @param seconds The observation second.
   * @param impact The contact second.
   * @param step The difference step, seconds.
   * @returns World metres.
   */
  export function predict(aim: (seconds: number) => IAutoMovieVector3, seconds: number, impact: number, step: number): IAutoMovieVector3 {
    const now: IAutoMovieVector3 = aim(seconds);
    const before: IAutoMovieVector3 = aim(seconds - step);
    const velocity: IAutoMovieVector3 = Vector3.scale(Vector3.subtract(now, before), 1 / step);
    return Vector3.add(now, Vector3.scale(velocity, Math.max(0, impact - seconds)));
  }

  /**
   * Track a target.
   *
   * @param aim The target's point at a film second; called only at seconds at or before the one evaluated.
   * @param timing The timing.
   * @param offset A fixed offset added to every prediction (the declared accuracy and the seeded scatter), world metres.
   * @returns The tracker, memoising each observation.
   */
  export function track(aim: (seconds: number) => IAutoMovieVector3, timing: ITiming, offset: IAutoMovieVector3): ITracker {
    const times: number[] = observations(timing);
    const predictions: Map<number, IAutoMovieVector3> = new Map();
    const prediction = (k: number): IAutoMovieVector3 => {
      let p: IAutoMovieVector3 | undefined = predictions.get(k);
      if (p === undefined) {
        p = Vector3.add(predict(aim, times[k]!, timing.impact, timing.step), offset);
        predictions.set(k, p);
      }
      return p;
    };
    const planned: IAutoMovieVector3 = prediction(0);
    const units = (seconds: number): superposeMinimumJerk.IUnit[] => {
      const out: superposeMinimumJerk.IUnit[] = [];
      for (let k: number = 1; k < times.length; k++) {
        const start: number = times[k]! + timing.latency;
        if (start > seconds) break;
        out.push({ displacement: Vector3.subtract(prediction(k), prediction(k - 1)), start, duration: timing.impact - start });
      }
      return out;
    };
    return {
      planned,
      units,
      goal: (seconds: number): IAutoMovieVector3 =>
        units(seconds).reduce((g: IAutoMovieVector3, u: superposeMinimumJerk.IUnit): IAutoMovieVector3 => Vector3.add(g, u.displacement), planned),
    };
  }
}
