import type { IAutoMovieCurve64 as C } from "@automovie/engine/geometry/curve";

import type { AutoMovieRecoveryObservationProvenance } from "../../typings/AutoMovieRecoveryObservationProvenance";
import type { IAutoMovieRecoveryObservationTangents } from "./IAutoMovieRecoveryObservationTangents";

/**
 * One working point entry before canonical ordering and output-row assembly.
 *
 * @evidence contracts/common.md#principled-implementation An entry carries physical position, phase, requests, directions and origin through sorting without recomputing correspondence.
 * @evidence contracts/common.md#clear-and-simple-design The working record reuses the same tangent and provenance contracts as the public result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A virtual point remains distinct from an original point through its provenance and null anchor.
 * @evidence contracts/common.md#meaningful-documentation Defines millimetres, periodic phase, feature flags and working-entry ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased working record performs no sorting.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The synchronous transport call owns working entries until result assembly.
 */
export interface IAutoMovieRecoveryObservationEntry {
  /** Canonical phase in [0, 1), before final increasing-order assembly. */
  phase: number;

  /** Physical position in millimetres. */
  point: C.Vector;

  /** Persistent current identity, or null for an unnamed or virtual point. */
  anchorId: string | null;

  /** Whether this point retains an original corner request. */
  corner: boolean;

  /** Whether this point is requested in the transported sampling schedule. */
  schedule: boolean;

  /** Unit directions on the two traversal sides. */
  tangents: IAutoMovieRecoveryObservationTangents;

  /** Original observation or explicit PL-interior origin. */
  provenance: AutoMovieRecoveryObservationProvenance;
}
