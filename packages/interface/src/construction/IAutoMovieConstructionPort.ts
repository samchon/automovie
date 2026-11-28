import type { IAutoMovieConstructionBandProfile } from "./IAutoMovieConstructionBandProfile";
import type { IAutoMovieConstructionNode } from "./IAutoMovieConstructionNode";
import type { IAutoMovieConstructionPortLoop } from "./IAutoMovieConstructionPortLoop";

/**
 * Attach a realized part rail to a closed port loop on the host's chart. The
 * host keeps the outside of the loop, and the part keeps stations beyond its
 * rail. The band shares both boundaries and their actual cross derivatives. A
 * failed premise restores the checkpoint and reports the port's diagnostic.
 */
export interface IAutoMovieConstructionPort {
  /** Select host-port attachment in the construction walk. */
  type: "port";

  /** Unique port name in the construction tree, used for its diagnostics. */
  name: string;

  /** Host construction subtree whose published face carries the port loop. */
  host: IAutoMovieConstructionNode;

  /** Name of the realized host face with the port's chart and loft chain. */
  hostFace: string;

  /** Closed port curve in the selected host chart. */
  loop: IAutoMovieConstructionPortLoop;

  /** Unique name published for the band's face and chain. */
  band: string;

  /**
   * Subtree of the attached construction part, realized under the port
   * checkpoint.
   */
  part: IAutoMovieConstructionNode;

  /** Name of the attached part's newly realized face carrying the rail. */
  partFace: string;

  /**
   * End of the part facing the host. The band replaces the portion from this
   * end to its selected rail.
   */
  partEnd: "bottom" | "top";

  /**
   * Positive distance in metres from the part end along its station into the
   * kept side. Used when rails is absent.
   */
  rail: number;

  /**
   * Optional distances in metres from the same end at uniform phases around the
   * attached part. Supply at least three positive values. The periodic cubic of
   * these distances is the actual rail. Omission uses the constant rail
   * distance.
   */
  rails?: number[];

  /**
   * Match the port and part rails by monotone angle about their centroids, the
   * default, or by normalized arclength after the first match for length mode.
   */
  correspondence?: "angle" | "length";

  /**
   * Cross-derivative scale policy for the band. Common, the default, uses one
   * safe factor across columns. Column prepares local factors under each
   * column's admitted limit.
   */
  ribbons?: "common" | "column";

  /**
   * Optional cross profiles that move the band's interior along its normal over
   * their authored clock windows. The underlying port and rail remain the seam
   * owners.
   */
  profiles?: IAutoMovieConstructionBandProfile[];

  /**
   * Port band columns around the loop. Use a multiple of four of at least
   * eight.
   */
  count: number;

  /**
   * Positive integer number of transverse grid subdivisions across the band
   * face.
   */
  rows: number;
}
