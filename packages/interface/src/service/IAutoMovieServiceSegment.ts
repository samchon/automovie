import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One run joining exactly two ports: a pipe, a duct, a conduit, a cable tray.
 *
 * The centre line is authored in world metres because that is what a clash is measured in, and the radius is what turns that line into the volume the run actually occupies. A run that leaves the space it started in is expected to name the sleeve it went through, which is the only way a wall can be shown to have been drilled on purpose.
 *
 * @evidence contracts/common.md#principled-implementation A world-meter polyline joins exact compatible port endpoints and its positive radius supplies swept clash bounds, while square-meter section and cited penetrations satisfy system and boundary admission.
 * @evidence contracts/common.md#clear-and-simple-design Route geometry and its two-port topology stay together, with boundary-owned sleeves referenced rather than embedded into each run.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Endpoints must coincide with ports and declared crossings must resolve; axis-aligned swept clash bounds are conservative and do not claim a hydraulic or exact cylindrical-intersection solver.
 * @evidence contracts/common.md#meaningful-documentation Defines system and direction-compatible ports, world route endpoints, positive radius/section and sleeve references.
 * @author Samchon
 */
export interface IAutoMovieServiceSegment {
  /** Stable segment identity within the network. */
  id: string;

  /** Id of the system this run belongs to. */
  system: string;

  /**
   * Id of the port the medium leaves from; it must be `out` or `bidirectional`.
   */
  from: string;

  /**
   * Id of the port the medium arrives at; it must be `in` or `bidirectional`.
   */
  to: string;

  /**
   * World centre line in metres, including both endpoints. The first point must coincide with the `from` port and the last with the `to` port.
   */
  route: IAutoMovieVector3[];

  /** Outer radius in metres used for clash and clearance; greater than `0`. */
  radius: number;

  /** Internal cross-section in square metres; greater than `0`. */
  section: number;

  /**
   * Ids of the penetrations this run passes through, in no particular order.
   */
  penetrations: string[];
}
