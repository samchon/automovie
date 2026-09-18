import { IAutoMovieTravelMotion } from "./IAutoMovieTravelMotion";

/**
 * One member of a run that travels on a single degree of freedom.
 *
 * The carriage drives a visible element whose own local transform is its rest
 * pose, exactly as a door panel does, so a lift car is placed once and moved by
 * its states rather than being placed again per state. The element is one the
 * run already declares in {@link IAutoMovieBuiltConnector.elements}, or one
 * below it: a car that belongs to no run is a car nobody can point at.
 *
 * @evidence requirements/interior/connections-and-circulation.md#interior-access-state Exposes `IAutoMovieConnectorCarriage` as the portable data boundary for the interior access state requirement.
 * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-connector-route-topology Types `IAutoMovieConnectorCarriage` for the interior space connector route topology system contract.
 */
export interface IAutoMovieConnectorCarriage {
  /**
   * Stable carriage identity within the connector.
   *
   * @evidence requirements/interior/connections-and-circulation.md#interior-access-state Exposes `id` as the portable data boundary for the interior access state requirement.
   * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-connector-route-topology Types `id` for the interior space connector route topology system contract.
   */
  id: string;
  /**
   * Visible element this carriage drives; its transform is the rest pose.
   *
   * @evidence requirements/interior/connections-and-circulation.md#interior-access-state Exposes `element` as the portable data boundary for the interior access state requirement.
   * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-connector-route-topology Types `element` for the interior space connector route topology system contract.
   */
  element: string;
  /**
   * The one degree of freedom this carriage travels on.
   *
   * @evidence requirements/interior/connections-and-circulation.md#interior-access-state Exposes `motion` as the portable data boundary for the interior access state requirement.
   * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-connector-route-topology Types `motion` for the interior space connector route topology system contract.
   */
  motion: IAutoMovieTravelMotion;
}
