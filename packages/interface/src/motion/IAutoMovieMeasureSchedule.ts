import type { IAutoMovieScheduleEntry } from "./IAutoMovieScheduleEntry";

/**
 * Classifiers and measurements for measureSchedule. Callbacks run
 * synchronously over borrowed entries, are not retained, and propagate
 * exceptions; callers own numeric validity and must not mutate the schedule.
 * Results are fresh, mutable records.
 */
export namespace IAutoMovieMeasureSchedule {
  /** The production's classification of entries. */
  export interface IClassify {
    /** Whether an entry counts as an action. */
    action(entry: IAutoMovieScheduleEntry): boolean;

    /**
     * Seconds within which a subject's next action is a combination; 0.5 by
     * default.
     */
    combinationGap?: number;

    /**
     * Signed displacements in the production's own lateral/linear convention;
     * the measurement sums their absolute values. Omission contributes zero.
     */
    displacement?(entry: IAutoMovieScheduleEntry): {
      /** Lateral displacement in metres under the classifier's chosen frame. */
      lateral: number;
      /** Forward/backward displacement in metres under that same frame. */
      linear: number;
    };

    /**
     * True excludes the entry from busy time; absent treats every entry as
     * busy.
     */
    idle?(entry: IAutoMovieScheduleEntry): boolean;

    /** A subject's presence; the whole schedule by default. */
    presence?(subject: string): {
      /**
       * First film second of the subject's presence; defaults to zero when the
       * callback is absent.
       */
      start: number;
      /**
       * Last film second of the presence; defaults to schedule.duration when
       * the callback is absent.
       */
      end: number;
    };

    /**
     * True includes the entry's interval in camera motion; absent includes no
     * interval. Overlapping intervals count once.
     */
    cameraMoves?(entry: IAutoMovieScheduleEntry): boolean;

    /** True counts one cut; absent counts no cuts. */
    cut?(entry: IAutoMovieScheduleEntry): boolean;
  }

  /** One subject's numbers. */
  export interface ISubject {
    /**
     * Sum of absolute lateral displacement divided by total absolute lateral
     * and linear displacement; zero when both totals vanish.
     */
    lateralShare: number;

    /** Seconds of presence without a non-idle entry. */
    idleSeconds: number;
  }

  /** The measurements. */
  export interface IMeasure {
    /**
     * Classified action count divided by schedule duration in minutes; zero for
     * nonpositive duration.
     */
    actionsPerMinute: number;

    /**
     * Fraction of actions whose start minus the same subject's previous action
     * end is at most the gap, including overlaps; zero with no actions.
     */
    combinationShare: number;

    /**
     * Measurements keyed by subjects appearing in entries; an empty schedule
     * yields an empty record.
     */
    subjects: Record<string, IAutoMovieMeasureSchedule.ISubject>;

    /**
     * Union duration of moving-camera intervals divided by schedule duration;
     * zero for nonpositive duration.
     */
    cameraMotionShare: number;

    /**
     * Classified cut count divided by duration in minutes; zero for nonpositive
     * duration.
     */
    cutsPerMinute: number;
  }
}
