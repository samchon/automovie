import { IAutoMovieCarriageValue } from "./IAutoMovieCarriageValue";

/**
 * One named operating state of a run and the travel it gives each carriage.
 *
 * @evidence contracts/common.md#principled-implementation Pairs a state name with one rest-relative value per carriage and a three-valued drive; validation keeps each value finite and inside its carriage's travel range and refuses `reverse` on a connector whose `bidirectional` is false.
 * @evidence contracts/common.md#clear-and-simple-design The drive sits on the state rather than on each carriage because a run is driven one way at a time; no engine computation reads `drive` today, so it is a validated record for later traversal work.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No state id is reserved, so `level-3` or `ascending` are author vocabulary; the only constants are the three drive literals the contract defines.
 * @evidence contracts/common.md#meaningful-documentation States the stable-name role of `id`, the exactly-once carriage rule, what each drive value means relative to `from` and `to`, the one-way restriction, and that no computation consumes the drive.
 * @author Samchon
 */
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
   * car and a switched-off escalator have in common. Validation checks it, but
   * no placement, drawing, or render reads it.
   */
  drive: "forward" | "reverse" | "still";
}
