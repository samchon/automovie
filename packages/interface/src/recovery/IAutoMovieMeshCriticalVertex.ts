import type { AutoMovieVector3Tuple } from "..";

/**
 * Private transient PL critical point; serialize physical observations, never
 * vertex addresses.
 */
export interface IAutoMovieMeshCriticalVertex {
  /**
   * Transient canonical source address, discarded before publishing
   * observations.
   */
  vertex: number;

  /** Physical scalar projection onto the unit sweep axis. */
  level: number;

  /** Physical source location of the critical event. */
  p: AutoMovieVector3Tuple;

  /** Number of connected components in the lower vertex link. */
  lower: number;

  /** Number of connected components in the upper vertex link. */
  upper: number;

  /**
   * Whether neighbouring vertices share the exact scalar level and need a
   * symbolic tie.
   */
  flat: boolean;

  /** Whether the complete welded link is one connected degree-two cycle. */
  manifold: boolean;
}
