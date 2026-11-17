import type { IAutoMovieSchedule } from "./IAutoMovieSchedule";

/** Classifiers and measurements for measureAutoMovieSchedule. Callbacks run synchronously over borrowed entries, are not retained, and propagate exceptions; callers own numeric validity and must not mutate the schedule. Results are fresh, mutable records. */
export namespace IAutoMovieMeasureSchedule {
  /**
 * The production's classification of entries.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives classifier defaults, signed displacement interpretation, callback lifetime and presence timebase.
 * @evidence contracts/development/design.md#principled-representation Callbacks describe action membership and film-time intervals; absolute metre displacements yield lateral share. Numeric validity remains the classifier's responsibility.
 * @evidence contracts/development/design.md#minimal-and-owned-surface measureAutoMovieSchedule borrows schedule entries and executes these production policies synchronously without retaining callbacks.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Independent optional classifiers omit particular measurements; they do not represent conflicting states of one variant.
 */
    export interface IClassify {
      /** Whether an entry counts as an action. */
      action(entry: IAutoMovieSchedule.IEntry): boolean;
  
      /** Seconds within which a subject's next action is a combination; 0.5 by default. */
      combinationGap?: number;
  
      /** Signed displacements in the production's own lateral/linear convention; the measurement sums their absolute values. Omission contributes zero. */
      displacement?(entry: IAutoMovieSchedule.IEntry): {
        /** Lateral displacement in metres under the classifier's chosen frame. */
        lateral: number;
        /** Forward/backward displacement in metres under that same frame. */
        linear: number;
      };
  
      /** True excludes the entry from busy time; absent treats every entry as busy. */
      idle?(entry: IAutoMovieSchedule.IEntry): boolean;
  
      /** A subject's presence; the whole schedule by default. */
      presence?(subject: string): {
        /** First film second of the subject's presence; defaults to zero when the callback is absent. */
        start: number;
        /** Last film second of the presence; defaults to schedule.duration when the callback is absent. */
        end: number;
      };
  
      /** True includes the entry's interval in camera motion; absent includes no interval. Overlapping intervals count once. */
      cameraMoves?(entry: IAutoMovieSchedule.IEntry): boolean;
  
      /** True counts one cut; absent counts no cuts. */
      cut?(entry: IAutoMovieSchedule.IEntry): boolean;
    }

  /**
 * One subject's numbers.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines lateral fraction and uncovered presence duration, including zero displacement.
 * @evidence contracts/development/design.md#principled-representation lateralShare is a dimensionless absolute-displacement ratio; idleSeconds is presence duration minus the union of non-idle intervals, floored at zero.
 * @evidence contracts/development/design.md#minimal-and-owned-surface measureAutoMovieSchedule constructs one record per subject appearing in the entries.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Idle time is measured from interval coverage rather than summing overlapping actions twice.
 */
    export interface ISubject {
      /** Sum of absolute lateral displacement divided by total absolute lateral and linear displacement; zero when both totals vanish. */
      lateralShare: number;
  
      /** Seconds of presence without a non-idle entry. */
      idleSeconds: number;
    }

  /**
 * The measurements.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States rate denominators, overlap handling, empty subjects and zero-duration behavior.
 * @evidence contracts/development/design.md#principled-representation Action/cut rates use minutes, combination and camera-motion values are dimensionless fractions, and subject metrics are keyed by the schedule's actual subjects.
 * @evidence contracts/development/design.md#minimal-and-owned-surface measureAutoMovieSchedule returns these fresh mutable reporting records without retaining caller classifiers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No camera or action vocabulary is embedded; the production classifies entries through IClassify.
 */
    export interface IMeasure {
      /** Classified action count divided by schedule duration in minutes; zero for nonpositive duration. */
      actionsPerMinute: number;
  
      /** Fraction of actions whose start minus the same subject's previous action end is at most the gap, including overlaps; zero with no actions. */
      combinationShare: number;
  
      /** Measurements keyed by subjects appearing in entries; an empty schedule yields an empty record. */
      subjects: Record<string, IAutoMovieMeasureSchedule.ISubject>;
  
      /** Union duration of moving-camera intervals divided by schedule duration; zero for nonpositive duration. */
      cameraMotionShare: number;
  
      /** Classified cut count divided by duration in minutes; zero for nonpositive duration. */
      cutsPerMinute: number;
    }
}
