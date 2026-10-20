import { IAutoMovieCarriageValue } from "./IAutoMovieCarriageValue";

/**
 * One named operating state of a run and the travel it gives each carriage.
 *
 * @evidence contracts/common.md#principled-implementation A state is a total assignment, one value for every carriage of the operation, so the configuration it names is fully determined and validation can place the whole work under it without inventing a value for a missing carriage.
 * @evidence contracts/common.md#clear-and-simple-design A name, the per-carriage values, and one drive literal for the whole run; direction belongs to the run's state rather than to each carriage because a run is driven as one.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A reverse drive on a one-way run, an unknown or repeated carriage, a missing carriage value, and an unknown drive literal are each refused, and the doc states that `drive` is validated but read by no placement or render.
 * @evidence contracts/common.md#meaningful-documentation States the id's uniqueness scope, the once-per-carriage rule, what each drive literal means relative to `from` and `to`, the one-way restriction, and that nothing downstream reads the drive.
 */
export interface IAutoMovieConnectorState {
  /**
   * Stable state name such as `level-3`, `ascending`, or a production term,
   * unique within the operation.
   */
  id: string;

  /** One value per carriage; every carriage of the operation appears once. */
  carriages: IAutoMovieCarriageValue[];

  /**
   * Which way the run is driven while it stands in this state.
   *
   * `forward` runs from {@link IAutoMovieBuiltConnector.from} towards
   * {@link IAutoMovieBuiltConnector.to} and `reverse` the other way, so a
   * one-way run may not declare a `reverse` state. `still` is a run that is not
   * being driven, such as a stopped car or a switched-off escalator. Validation
   * checks it, but no placement, drawing, or render reads it.
   */
  drive: "forward" | "reverse" | "still";
}
