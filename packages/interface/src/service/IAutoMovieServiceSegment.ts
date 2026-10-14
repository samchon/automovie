import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One run joining exactly two ports: a pipe, a duct, a conduit, a cable tray.
 *
 * The centre line is authored in world metres because that is what a clash is measured in, and the radius is what turns that line into the volume the run actually occupies. A run that leaves the space it started in is expected to name the sleeve it went through, which is the only way a wall can be shown to have been drilled on purpose.
 *
 * @evidence contracts/common.md#principled-implementation A world-meter polyline joins compatible ports within the gate's 1e-6 metre endpoint tolerance. Positive radius supplies swept clash bounds; declared section matches nonnull port sections within the existing 1e-9 square-metre tolerance, and sleeve references undergo fit and crossing checks.
 * @evidence contracts/common.md#clear-and-simple-design Route geometry and its two-port topology stay together, with boundary-owned sleeves referenced rather than embedded into each run.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Endpoint and section tolerances are explicit. Crossings inspect route vertices rather than every point of a leg, and shared-node run pairs are exempt from clash comparison; axis-aligned swept bounds do not establish exact cylindrical separation or hydraulic performance.
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
   * World centre line in metres with at least two finite points. Its endpoints must lie within 1e-6 metres of their ports; consecutive points must be farther apart than 1e-9 metres. Vertex-based crossing checks do not prove continuous containment along every leg.
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
