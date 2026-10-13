import { IAutoMovieCarriageValue } from "./IAutoMovieCarriageValue";

/** One named operating state of a run and the travel it gives each carriage. */
export interface IAutoMovieConnectorState {
  /** Stable state name such as `level-3`, `ascending`, or a production term. */
  id: string;

  /** One value per carriage; every carriage of the operation appears once. */
  carriages: IAutoMovieCarriageValue[];

  /**
   * Which way the run is driven while it stands in this state.
   *
   * `forward` runs from {@link IAutoMovieBuiltConnector.from} towards
   * {@link IAutoMovieBuiltConnector.to} and `reverse` the other way, so a
   * one-way run may not declare a state driven against its own direction.
   * `still` is a run that is not being driven at all, which is what a stopped
   * car and a switched-off escalator have in common.
   */
  drive: "forward" | "reverse" | "still";
}
