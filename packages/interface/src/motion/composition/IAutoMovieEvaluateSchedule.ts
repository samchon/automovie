import type { IAutoMovieScheduleEntry } from "./IAutoMovieScheduleEntry";

/**
 * Data and callback contracts shared by the EvaluateSchedule operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The instant uses film seconds; active entries keep input entry order and carry local seconds and normalized phase in [0, 1). State values are borrowed from the latest ended entry, breaking equal-end ties by larger entry index.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This namespace groups the IAutoMovieEvaluateSchedule contracts used by packages/engine/src/composition/evaluateAutoMovieSchedule.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.
 * @evidence contracts/development/design.md#principled-representation The instant uses film seconds; active entries keep input entry order and carry local seconds and normalized phase in [0, 1). State values are borrowed from the latest ended entry, breaking equal-end ties by larger entry index. The namespace groups these type contracts without implementing the operation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieEvaluateSchedule contract belongs to interface; packages/engine/src/composition/evaluateAutoMovieSchedule.ts uses its nested records and callbacks. Runtime computation remains with those consumers.
 */
export namespace IAutoMovieEvaluateSchedule {
  /**
   * One active entry.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The instant uses film seconds; active entries keep input entry order and carry local seconds and normalized phase in [0, 1). State values are borrowed from the latest ended entry, breaking equal-end ties by larger entry index.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMovieEvaluateSchedule.IActive keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation The instant uses film seconds; active entries keep input entry order and carry local seconds and normalized phase in [0, 1). State values are borrowed from the latest ended entry, breaking equal-end ties by larger entry index. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieEvaluateSchedule.IActive contract belongs to interface; packages/engine/src/composition/evaluateAutoMovieSchedule.ts uses this boundary. Runtime computation remains with those consumers.
   */
  export interface IActive {
    /** The entry. */
    entry: IAutoMovieScheduleEntry;

    /** Seconds since its start. */
    local: number;

    /** Share of its duration elapsed, in [0, 1). */
    phase: number;
  }

  /**
   * The schedule at an instant.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The instant uses film seconds; active entries keep input entry order and carry local seconds and normalized phase in [0, 1). State values are borrowed from the latest ended entry, breaking equal-end ties by larger entry index.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMovieEvaluateSchedule.IInstant keeps the operation's declared data fields separate from its implementation. The unknown state values belong to production-defined schedule state, which the engine only passes through.
   * @evidence contracts/development/design.md#principled-representation The instant uses film seconds; active entries keep input entry order and carry local seconds and normalized phase in [0, 1). State values are borrowed from the latest ended entry, breaking equal-end ties by larger entry index. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieEvaluateSchedule.IInstant contract belongs to interface; packages/engine/src/composition/evaluateAutoMovieSchedule.ts uses this boundary. Runtime computation remains with those consumers.
   */
  export interface IInstant {
    /** Film seconds on the schedule's clock. */
    seconds: number;

    /** Active entries in the supplied schedule's entry order; this reader does not sort them. */
    active: IAutoMovieEvaluateSchedule.IActive[];

    /** Borrowed state from each subject's latest ended entry with a state; equal end times choose the larger entry index. */
    states: Record<string, unknown>;
  }
}
