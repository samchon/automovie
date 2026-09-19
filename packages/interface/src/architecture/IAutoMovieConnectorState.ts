import { IAutoMovieCarriageValue } from "./IAutoMovieCarriageValue";

/**
 * One named operating state of a run and the travel it gives each carriage.
 *
 * @evidence requirements/interior/connections-and-circulation.md#interior-access-state Exposes `IAutoMovieConnectorState` as the portable data boundary for the interior access state requirement.
 * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-connector-route-topology Types `IAutoMovieConnectorState` for the interior space connector route topology system contract.
 */
export interface IAutoMovieConnectorState {
  /**
   * Stable state name such as `level-3`, `ascending`, or a production term.
   *
   * @evidence requirements/interior/connections-and-circulation.md#interior-access-state Exposes `id` as the portable data boundary for the interior access state requirement.
   * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-connector-route-topology Types `id` for the interior space connector route topology system contract.
   */
  id: string;

  /**
   * One value per carriage; every carriage of the operation appears once.
   *
   * @evidence requirements/interior/connections-and-circulation.md#interior-access-state Exposes `carriages` as the portable data boundary for the interior access state requirement.
   * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-connector-route-topology Types `carriages` for the interior space connector route topology system contract.
   */
  carriages: IAutoMovieCarriageValue[];

  /**
   * Which way the run is driven while it stands in this state.
   *
   * `forward` runs from {@link IAutoMovieBuiltConnector.from} towards
   * {@link IAutoMovieBuiltConnector.to} and `reverse` the other way, so a
   * one-way run may not declare a state driven against its own direction.
   * `still` is a run that is not being driven at all, which is what a stopped
   * car and a switched-off escalator have in common.
   *
   * @evidence requirements/interior/connections-and-circulation.md#interior-access-state Exposes `drive` as the portable data boundary for the interior access state requirement.
   * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-connector-route-topology Types `drive` for the interior space connector route topology system contract.
   */
  drive: "forward" | "reverse" | "still";
}
