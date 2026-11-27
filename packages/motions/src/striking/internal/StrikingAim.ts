import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanStrikingAim,
  IAutoMovieSuperposeMinimumJerk,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * How a strike follows its target: the goal planned at the launch from where
 * the target is predicted to be at contact, and then online corrections, each a
 * minimum-jerk unit superposed on the strike's goal, as the target is seen to
 * move.
 *
 * A performer observes the target every film frame from the launch. Each
 * observation predicts the target's point at contact by extrapolating its
 * current velocity (a first-order prediction, the simplest model of
 * interception of moving targets; Brenner and Smeets 1996), and the change of
 * that prediction since the previous observation is added to the goal by a new
 * minimum-jerk unit that starts one visuomotor correction latency after the
 * observation and ends at the contact (Flash and Henis 1991: a second unit
 * superposed on the first, not an aborted and re-planned movement; latency 0.11
 * s, Prablanc and Martin 1992). Observations stop once a correction could no
 * longer run for its shortest duration before contact, so a target that starts
 * moving later than that is not followed: the strike lands on the line it
 * committed to, which is how a well-timed slip makes a punch miss, and why a
 * kick that commits at its chamber key (about one latency before impact) sweeps
 * through where the target was.
 *
 * A stationary target gives zero corrections and the planned goal unchanged; a
 * target moving at constant velocity is met exactly, because each prediction is
 * then exact.
 */
export namespace StrikingAim {
  /*
   * The observation step, seconds: one film frame at 24 frames a second, every
   * strike's alike.
   */
  export const STEP: number = 1 / 24;

  /*
   * The shortest correction unit a strike still starts before its contact,
   * seconds, every strike's alike (provisional).
   */
  export const SHORTEST: number = 0.04;

  /*
   * The observation seconds of a strike: from the launch, one per step, up to
   * the last one whose correction still lasts its shortest duration.
   * Parameter timing: The timing.
   * Returns: Film seconds, ascending, the launch first.
   * When the contact is not after the launch.
   */
  export function observations(
    timing: IAutoMovieMotionHumanStrikingAim.ITiming,
  ): number[] {
    if (!(timing.impact > timing.launch))
      throw new Error("A strike's contact comes after its launch");
    const last: number = timing.impact - timing.latency - timing.shortest;
    const out: number[] = [timing.launch];
    for (let k: number = 1; ; k++) {
      const t: number = timing.launch + k * timing.step;
      if (t > last + 1e-9) break;
      out.push(t);
    }
    return out;
  }

  /*
   * The target's point predicted at contact from one observation: its point
   * then plus its velocity (a backward difference over one step) times the time
   * left.
   * Parameter aim: The target's point at a film second.
   * Parameter seconds: The observation second.
   * Parameter impact: The contact second.
   * Parameter step: The difference step, seconds.
   * Returns: World metres.
   */
  export function predict(
    aim: (seconds: number) => IAutoMovieVector3,
    seconds: number,
    impact: number,
    step: number,
  ): IAutoMovieVector3 {
    const now: IAutoMovieVector3 = aim(seconds);
    const before: IAutoMovieVector3 = aim(seconds - step);
    const velocity: IAutoMovieVector3 = AutoMovieEngineVector3.scale(
      AutoMovieEngineVector3.subtract(now, before),
      1 / step,
    );
    return AutoMovieEngineVector3.add(
      now,
      AutoMovieEngineVector3.scale(velocity, Math.max(0, impact - seconds)),
    );
  }

  /*
   * Track a target.
   * Parameter aim: The target's point at a film second; called once at each
   * observation and a step before it, when the tracker is made.
   * Parameter timing: The timing.
   * Parameter offset: A fixed offset added to every prediction (the declared
   * accuracy and the seeded scatter), world metres.
   * Returns: The tracker, every observation's prediction made when it is.
   */
  export function track(
    aim: (seconds: number) => IAutoMovieVector3,
    timing: IAutoMovieMotionHumanStrikingAim.ITiming,
    offset: IAutoMovieVector3,
  ): IAutoMovieMotionHumanStrikingAim.ITracker {
    const times: number[] = observations(timing);

    // Every observation's prediction, made once here in observation order:
    // the knots of the corrections the tracker superposes.
    const predictions: readonly IAutoMovieVector3[] = times.map(
      (t: number): IAutoMovieVector3 =>
        AutoMovieEngineVector3.add(predict(aim, t, timing.impact, timing.step), offset),
    );
    const prediction = (k: number): IAutoMovieVector3 => predictions[k]!;
    const planned: IAutoMovieVector3 = prediction(0);
    const started: (
      seconds: number,
      emit: (
        displacement: IAutoMovieVector3,
        start: number,
        duration: number,
      ) => void,
    ) => void = (
      seconds: number,
      emit: (
        displacement: IAutoMovieVector3,
        start: number,
        duration: number,
      ) => void,
    ): void => {
      for (let k: number = 1; k < times.length; k++) {
        const start: number = times[k]! + timing.latency;
        if (start > seconds) break;
        emit(
          AutoMovieEngineVector3.subtract(prediction(k), prediction(k - 1)),
          start,
          timing.impact - start,
        );
      }
    };
    const units: IAutoMovieMotionHumanStrikingAim.ITracker["units"] = (
      seconds: number,
    ): IAutoMovieSuperposeMinimumJerk.IUnit[] => {
      const out: IAutoMovieSuperposeMinimumJerk.IUnit[] = [];
      started(
        seconds,
        (
          displacement: IAutoMovieVector3,
          start: number,
          duration: number,
        ): void => {
          out.push({ displacement, start, duration });
        },
      );
      return out;
    };
    return {
      planned,
      units,
      goal: (seconds: number): IAutoMovieVector3 => {
        const displacements: IAutoMovieVector3[] = [];
        started(seconds, (displacement: IAutoMovieVector3): void => {
          displacements.push(displacement);
        });

        // Keep every opaque target observation before the original ordered fold.
        return displacements.reduce(
          (
            g: IAutoMovieVector3,
            displacement: IAutoMovieVector3,
          ): IAutoMovieVector3 => AutoMovieEngineVector3.add(g, displacement),
          planned,
        );
      },
    };
  }
}
