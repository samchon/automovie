import type { IAutoMovieCarriageValue } from "./IAutoMovieCarriageValue";

/** One named operating state of a run and the travel it gives each carriage. */
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
