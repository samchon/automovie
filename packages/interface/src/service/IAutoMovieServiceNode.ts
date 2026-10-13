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
 */
export interface IAutoMovieServiceNode {
  /** Stable node identity within the network. */
  id: string;

  /**
   * Computational family; it selects which validations apply, not a catalogue.
   */
  kind: AutoMovieServiceNodeKind;

  /** Id of the logical space of the served environment the node stands in. */
  space: string;

  /** Id of the built element realizing it, or `null` for a bare junction. */
  element: string | null;

  /** World position in metres. */
  position: IAutoMovieVector3;

  /** Typed connection points this node offers, one per system it touches. */
  ports: IAutoMovieServicePort[];

  /**
   * Named operating state of an inline device, or `null` when the node has no
   * moving part. A valve, a damper and a switch are the same object here.
   */
  state: IAutoMovieServiceState | null;

  /**
   * Volume in **node-local** metres that must stay clear for the node to be
   * serviced — the door swing of a panel, the pull space of a filter, the reach
   * in front of a valve — or `null` when the node needs none. The world volume
   * is this box offset by {@link position}, which is the same axis-aligned
   * keep-out a prop declares, so one collision rule covers both.
   */
  maintenance: IAutoMoviePropBox | null;
}
