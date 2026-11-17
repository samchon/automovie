import type { AutoMovieVector3Tuple } from "../../index";

/** Private transient PL critical point; serialize physical observations, never vertex addresses.
 *
 * @evidence contracts/development/design.md#principled-representation Lower and upper link populations classify the PL scalar event; flat ties and a nonmanifold full link remain independent flags rather than an inferred smooth critical point.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The critical observer supplies one source address, position and link classification for section-bracket and slab-event consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A critical source vertex is acquisition evidence, not an authorized cap, fitted surface or a generated control address.
 * @evidence contracts/development/common.md#meaningful-documentation Names private source-address ownership, scalar/position units and the independent flat/manifold qualification limits.
 */
export interface IAutoMovieMeshCriticalVertex {
 
 /** Transient canonical source address, discarded before publishing observations. */
  vertex: number;
 
 /** Physical scalar projection onto the unit sweep axis. */
  level: number;
 
 /** Physical source location of the critical event. */
  p: AutoMovieVector3Tuple;
 
 /** Number of connected components in the lower vertex link. */
  lower: number;
 
 /** Number of connected components in the upper vertex link. */
  upper: number;
 
 /** Whether neighbouring vertices share the exact scalar level and need a symbolic tie. */
  flat: boolean;
 
 /** Whether the complete welded link is one connected degree-two cycle. */
  manifold: boolean;
}
