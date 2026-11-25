import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePropBox } from "../harness/IAutoMoviePropBox";
import type { AutoMovieServiceNodeKind } from "./AutoMovieServiceNodeKind";
import type { IAutoMovieServicePort } from "./IAutoMovieServicePort";
import type { IAutoMovieServiceState } from "./IAutoMovieServiceState";

/**
 * One fixture, machine, junction, terminal or inline device on the network.
 *
 * A basin, a sprinkler head, a socket outlet, a diffuser, an air handling unit,
 * a tee in a chase and a shut-off valve are all this record. What separates
 * them is the ports they carry and the volume they need to be serviced in, not
 * a class hierarchy: a media wall that is simultaneously a wall, a powered
 * device and a light source declares the ports for each and stays one node.
 */
export interface IAutoMovieServiceNode {
  /** Stable node identity within the network. */
  id: string;

  /**
   * Semantic equipment role, checked against the closed vocabulary. Current
   * node/port admission applies the same rules to every role; `kind` supplies
   * no inferred geometry, load or operating state.
   */
  kind: AutoMovieServiceNodeKind;

  /** Id of the logical space of the served environment the node stands in. */
  space: string;

  /** Id of the built element realizing it, or `null` for a bare junction. */
  element: string | null;

  /** World position in metres. */
  position: IAutoMovieVector3;

  /**
   * Typed connection points this node offers; several may belong to the same
   * system.
   */
  ports: IAutoMovieServicePort[];

  /**
   * Named operating state of an inline device, or `null` when the node has no
   * moving part. A valve, a damper and a switch are the same object here.
   */
  state: IAutoMovieServiceState | null;

  /**
   * Node-local axis-aligned maintenance volume in metres, such as panel-door
   * swing or filter pull space; null declares no keep-out. Translation by
   * position forms its world box without an equipment-specific rotation or
   * inferred extent.
   */
  maintenance: IAutoMoviePropBox | null;
}
