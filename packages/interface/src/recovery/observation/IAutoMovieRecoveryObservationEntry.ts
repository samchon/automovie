import type { AutoMovieVector3Tuple, IAutoMovieRecoveryObservationProvenance, IAutoMovieRecoveryObservationTangents } from "../../index";


/** One working point entry before canonical ordering and output-row assembly.
 *
 * @evidence contracts/development/design.md#principled-representation An entry carries physical position, phase, requests, directions and origin through sorting without recomputing correspondence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The working record reuses the same tangent and provenance contracts as the public result.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A virtual point remains distinct from an original point through its provenance and null anchor.
 * @evidence contracts/development/common.md#meaningful-documentation Defines millimetres, periodic phase, feature flags and working-entry ownership.
 */
export interface IAutoMovieRecoveryObservationEntry {
 
 /** Canonical phase in [0, 1), before final increasing-order assembly. */
  phase: number;

 
 /** Physical position in millimetres. */
  point: Readonly<AutoMovieVector3Tuple>;

 
 /** Persistent current identity, or null for an unnamed or virtual point. */
  anchorId: string | null;

 
 /** Whether this point retains an original corner request. */
  corner: boolean;

 
 /** Whether this point is requested in the transported sampling schedule. */
  schedule: boolean;

 
 /** Unit directions on the two traversal sides. */
  tangents: IAutoMovieRecoveryObservationTangents;

 
 /** Original observation or explicit PL-interior origin. */
  provenance: IAutoMovieRecoveryObservationProvenance;
}
