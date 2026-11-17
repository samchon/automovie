import type { IAutoMovieScheduleEntry } from "./IAutoMovieScheduleEntry";

/**
 * Classifiers and measurements for measureAutoMovieSchedule. Callbacks run synchronously over borrowed entries, are not retained, and propagate exceptions; callers own numeric validity and must not mutate the schedule. Results are fresh, mutable records.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Classification callbacks use borrowed schedule entries and film-time intervals; displacements are metres, rates are per minute and shares are dimensionless. Callback exceptions propagate; returned measurement records are fresh and callers own numeric validity.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This namespace groups the IAutoMovieMeasureSchedule contracts used by packages/engine/src/composition/measureAutoMovieSchedule.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.
 * @evidence contracts/development/design.md#principled-representation Classification callbacks use borrowed schedule entries and film-time intervals; displacements are metres, rates are per minute and shares are dimensionless. Callback exceptions propagate; returned measurement records are fresh and callers own numeric validity. The namespace groups these type contracts without implementing the operation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieMeasureSchedule contract belongs to interface; packages/engine/src/composition/measureAutoMovieSchedule.ts uses its nested records and callbacks. Runtime computation remains with those consumers.
 */
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
    /**
     * Whether an entry counts as an action.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMeasureSchedule.IClassify.action: Whether an entry counts as an action.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMeasureSchedule.IClassify.action is used through packages/engine/src/composition/measureAutoMovieSchedule.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMeasureSchedule.IClassify.action is used through packages/engine/src/composition/measureAutoMovieSchedule.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMeasureSchedule.IClassify.action is used through packages/engine/src/composition/measureAutoMovieSchedule.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMeasureSchedule.IClassify.action is used through packages/engine/src/composition/measureAutoMovieSchedule.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMeasureSchedule.IClassify.action is used through packages/engine/src/composition/measureAutoMovieSchedule.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMeasureSchedule.IClassify.action is used through packages/engine/src/composition/measureAutoMovieSchedule.ts.
     */
    action(entry: IAutoMovieScheduleEntry): boolean;

    /** Seconds within which a subject's next action is a combination; 0.5 by default. */
    combinationGap?: number;

    /**
     * Signed displacements in the production's own lateral/linear convention; the measurement sums their absolute values. Omission contributes zero.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMeasureSchedule.IClassify.displacement: Signed displacements in the production's own lateral/linear convention; the measurement sums their absolute values. Omission contributes zero.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMeasureSchedule.IClassify.displacement is used through packages/engine/src/composition/measureAutoMovieSchedule.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMeasureSchedule.IClassify.displacement is used through packages/engine/src/composition/measureAutoMovieSchedule.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMeasureSchedule.IClassify.displacement is used through packages/engine/src/composition/measureAutoMovieSchedule.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMeasureSchedule.IClassify.displacement is used through packages/engine/src/composition/measureAutoMovieSchedule.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMeasureSchedule.IClassify.displacement is used through packages/engine/src/composition/measureAutoMovieSchedule.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMeasureSchedule.IClassify.displacement is used through packages/engine/src/composition/measureAutoMovieSchedule.ts.
     */
    displacement?(entry: IAutoMovieScheduleEntry): {
      /** Lateral displacement in metres under the classifier's chosen frame. */
      lateral: number;
      /** Forward/backward displacement in metres under that same frame. */
      linear: number;
    };

    /**
     * True excludes the entry from busy time; absent treats every entry as busy.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMeasureSchedule.IClassify.idle: True excludes the entry from busy time; absent treats every entry as busy.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMeasureSchedule.IClassify.idle is used through packages/engine/src/composition/measureAutoMovieSchedule.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMeasureSchedule.IClassify.idle is used through packages/engine/src/composition/measureAutoMovieSchedule.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMeasureSchedule.IClassify.idle is used through packages/engine/src/composition/measureAutoMovieSchedule.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMeasureSchedule.IClassify.idle is used through packages/engine/src/composition/measureAutoMovieSchedule.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMeasureSchedule.IClassify.idle is used through packages/engine/src/composition/measureAutoMovieSchedule.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMeasureSchedule.IClassify.idle is used through packages/engine/src/composition/measureAutoMovieSchedule.ts.
     */
    idle?(entry: IAutoMovieScheduleEntry): boolean;

    /**
     * A subject's presence; the whole schedule by default.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMeasureSchedule.IClassify.presence: A subject's presence; the whole schedule by default.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMeasureSchedule.IClassify.presence is used through packages/engine/src/composition/measureAutoMovieSchedule.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMeasureSchedule.IClassify.presence is used through packages/engine/src/composition/measureAutoMovieSchedule.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMeasureSchedule.IClassify.presence is used through packages/engine/src/composition/measureAutoMovieSchedule.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMeasureSchedule.IClassify.presence is used through packages/engine/src/composition/measureAutoMovieSchedule.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMeasureSchedule.IClassify.presence is used through packages/engine/src/composition/measureAutoMovieSchedule.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMeasureSchedule.IClassify.presence is used through packages/engine/src/composition/measureAutoMovieSchedule.ts.
     */
    presence?(subject: string): {
      /** First film second of the subject's presence; defaults to zero when the callback is absent. */
      start: number;
      /** Last film second of the presence; defaults to schedule.duration when the callback is absent. */
      end: number;
    };

    /**
     * True includes the entry's interval in camera motion; absent includes no interval. Overlapping intervals count once.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMeasureSchedule.IClassify.cameraMoves: True includes the entry's interval in camera motion; absent includes no interval. Overlapping intervals count once.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMeasureSchedule.IClassify.cameraMoves is used through packages/engine/src/composition/measureAutoMovieSchedule.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMeasureSchedule.IClassify.cameraMoves is used through packages/engine/src/composition/measureAutoMovieSchedule.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMeasureSchedule.IClassify.cameraMoves is used through packages/engine/src/composition/measureAutoMovieSchedule.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMeasureSchedule.IClassify.cameraMoves is used through packages/engine/src/composition/measureAutoMovieSchedule.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMeasureSchedule.IClassify.cameraMoves is used through packages/engine/src/composition/measureAutoMovieSchedule.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMeasureSchedule.IClassify.cameraMoves is used through packages/engine/src/composition/measureAutoMovieSchedule.ts.
     */
    cameraMoves?(entry: IAutoMovieScheduleEntry): boolean;

    /**
     * True counts one cut; absent counts no cuts.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMeasureSchedule.IClassify.cut: True counts one cut; absent counts no cuts.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMeasureSchedule.IClassify.cut is used through packages/engine/src/composition/measureAutoMovieSchedule.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMeasureSchedule.IClassify.cut is used through packages/engine/src/composition/measureAutoMovieSchedule.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMeasureSchedule.IClassify.cut is used through packages/engine/src/composition/measureAutoMovieSchedule.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMeasureSchedule.IClassify.cut is used through packages/engine/src/composition/measureAutoMovieSchedule.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMeasureSchedule.IClassify.cut is used through packages/engine/src/composition/measureAutoMovieSchedule.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMeasureSchedule.IClassify.cut is used through packages/engine/src/composition/measureAutoMovieSchedule.ts.
     */
    cut?(entry: IAutoMovieScheduleEntry): boolean;
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
