import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMoviePropBox } from "../harness/IAutoMoviePropBox";
import { AutoMovieServiceNodeKind } from "./AutoMovieServiceNodeKind";
import { IAutoMovieServicePort } from "./IAutoMovieServicePort";
import { IAutoMovieServiceState } from "./IAutoMovieServiceState";

/**
 * One fixture, machine, junction, terminal or inline device on the network.
 *
 * A basin, a sprinkler head, a socket outlet, a diffuser, an air handling unit,
 * a tee in a chase and a shut-off valve are all this record. What separates
 * them is the ports they carry and the volume they need to be serviced in, not
 * a class hierarchy: a media wall that is simultaneously a wall, a powered
 * device and a light source declares the ports for each and stays one node.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `IAutoMovieServiceNode` as the portable data boundary for the interior service network validation requirement.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `IAutoMovieServiceNode` for the interior space service network contract system contract.
 */
export interface IAutoMovieServiceNode {
  /**
   * Stable node identity within the network.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `id` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `id` for the interior space service network contract system contract.
   */
  id: string;

  /**
   * Computational family; it selects which validations apply, not a catalogue.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `kind` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `kind` for the interior space service network contract system contract.
   */
  kind: AutoMovieServiceNodeKind;

  /**
   * Id of the logical space of the served environment the node stands in.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `space` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `space` for the interior space service network contract system contract.
   */
  space: string;

  /**
   * Id of the built element realizing it, or `null` for a bare junction.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `element` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `element` for the interior space service network contract system contract.
   */
  element: string | null;

  /**
   * World position in metres.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `position` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `position` for the interior space service network contract system contract.
   */
  position: IAutoMovieVector3;

  /**
   * Typed connection points this node offers, one per system it touches.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `ports` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `ports` for the interior space service network contract system contract.
   */
  ports: IAutoMovieServicePort[];

  /**
   * Named operating state of an inline device, or `null` when the node has no
   * moving part. A valve, a damper and a switch are the same object here.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `state` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `state` for the interior space service network contract system contract.
   */
  state: IAutoMovieServiceState | null;

  /**
   * Volume in **node-local** metres that must stay clear for the node to be
   * serviced — the door swing of a panel, the pull space of a filter, the reach
   * in front of a valve — or `null` when the node needs none. The world volume
   * is this box offset by {@link position}, which is the same axis-aligned
   * keep-out a prop declares, so one collision rule covers both.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `maintenance` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `maintenance` for the interior space service network contract system contract.
   */
  maintenance: IAutoMoviePropBox | null;
}
