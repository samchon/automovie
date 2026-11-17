import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanStrikingAim,
  IAutoMovieSuperposeMinimumJerk,
  IAutoMovieVector3,
} from "@automovie/interface";

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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the observation, prediction and correction model with its sources, the cutoff and the exact cases.
 * @evidence contracts/development/design.md#principled-representation Tracking as film-second timing, a planned goal in world metres and superposed correction units, evaluated causally.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The timing, the tracker and the three functions the punch and kick laws and the tests read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the engine's minimum-jerk unit and the interface vector.
 */
export namespace StrikingAim {
  /**


  

  /**
   * The observation seconds of a strike: from the launch, one per step, up to
   * the last one whose correction still lasts its shortest duration.
   *
   * @param timing The timing.
   * @returns Film seconds, ascending, the launch first.
   * @throws {Error} When the contact is not after the launch.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the schedule, its cutoff, the order and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation One observation per film frame from the launch while a correction starting a latency later can still run its shortest duration before contact.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A contact not after the launch throws; 1e-9 s absorbs rounding at the cutoff.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the observations.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function observations(timing: IAutoMovieMotionHumanStrikingAim.ITiming): number[] {
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the prediction, the difference and every unit.
   * @evidence contracts/development/implementation.md#principled-implementation First-order extrapolation with a backward difference (Brenner and Smeets 1996); a contact already past predicts the current point.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two reads and one extrapolation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the opaque target's exact now then seconds-step reads, original backward-difference scale and nonnegative remaining-time extrapolation; no future observation, alternative velocity or target snapshot replaces either call.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two target reads.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs; the tracker memoises its calls.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function predict(
    aim: (seconds: number) => IAutoMovieVector3,
    seconds: number,
    impact: number,
    step: number,
  ): IAutoMovieVector3 {
    const now: IAutoMovieVector3 = aim(seconds);
    const before: IAutoMovieVector3 = aim(seconds - step);
    const velocity: IAutoMovieVector3 = Vector3.scale(
      Vector3.subtract(now, before),
      1 / step,
    );
    return Vector3.add(
      now,
      Vector3.scale(velocity, Math.max(0, impact - seconds)),
    );
  }

  /**
   * Track a target.
   *
   * @param aim The target's point at a film second; called only at seconds at or before the one evaluated.
   * @param timing The timing.
   * @param offset A fixed offset added to every prediction (the declared accuracy and the seeded scatter), world metres.
   * @returns The tracker, memoising each observation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the causality of the target reads, the offset and the memo.
   * @evidence contracts/development/implementation.md#principled-implementation The planned goal is the launch observation's prediction; each later observation adds its change as a correction unit.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The original schedule/prediction owner feeds one started-observation iterator; units emits its original timed records, while goal collects only displacement vectors before the original ordered fold.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the original schedule, initial launch prediction, fixed offset, started-time comparison, actual prediction callback order and every correction difference. All observations/displacements still precede goal accumulation, and no sample, active unit, timing bound or fitted answer is skipped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each actual prediction is produced once under the original index memo; K active corrections still cost O(K). Goal-only reads omit K unused timed-unit records while retaining original displacement snapshots and fold order; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The original observation-index prediction memo remains. Units and goal share started-time tests and exact prediction/difference order; no query goal, unit output or accumulation is retained or reused across seconds.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The existing memo is bounded by the fixed observation count and released with the tracker. Each read owns its temporary fresh unit/displacement outputs, and goal-only vectors/array end on return or failure without extending history.
   */
  export function track(
    aim: (seconds: number) => IAutoMovieVector3,
    timing: IAutoMovieMotionHumanStrikingAim.ITiming,
    offset: IAutoMovieVector3,
  ): IAutoMovieMotionHumanStrikingAim.ITracker {
    const times: number[] = observations(timing);
    const predictions: Map<number, IAutoMovieVector3> = new Map();
    const prediction = (k: number): IAutoMovieVector3 => {
      let p: IAutoMovieVector3 | undefined = predictions.get(k);
      if (p === undefined) {
        p = Vector3.add(
          predict(aim, times[k]!, timing.impact, timing.step),
          offset,
        );
        predictions.set(k, p);
      }
      return p;
    };
    const planned: IAutoMovieVector3 = prediction(0);
    const started: (
      seconds: number,
      emit: (displacement: IAutoMovieVector3, start: number, duration: number) => void,
    ) => void = (
      seconds: number,
      emit: (displacement: IAutoMovieVector3, start: number, duration: number) => void,
    ): void => {
      for (let k: number = 1; k < times.length; k++) {
        const start: number = times[k]! + timing.latency;
        if (start > seconds) break;
        emit(Vector3.subtract(prediction(k), prediction(k - 1)), start, timing.impact - start);
      }
    };
    const units: IAutoMovieMotionHumanStrikingAim.ITracker["units"] = (seconds: number): IAutoMovieSuperposeMinimumJerk.IUnit[] => {
      const out: IAutoMovieSuperposeMinimumJerk.IUnit[] = [];
      started(seconds, (displacement: IAutoMovieVector3, start: number, duration: number): void => {
        out.push({ displacement, start, duration });
      });
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
          (g: IAutoMovieVector3, displacement: IAutoMovieVector3): IAutoMovieVector3 =>
            Vector3.add(g, displacement),
          planned,
        );
      },
    };
  }
}
