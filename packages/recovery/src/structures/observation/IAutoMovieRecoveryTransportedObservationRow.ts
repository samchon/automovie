import type { IAutoMovieCurve64 as C } from "@automovie/engine/geometry/curve";

import type { IAutoMovieRecoveryObservationTangents } from "./IAutoMovieRecoveryObservationTangents";

/**
 * A closed observation row ordered in the retained incoming canonical phase.
 *
 * @evidence contracts/common.md#principled-implementation Ordered physical points, feature ordinals, one-sided directions and an increasing periodic partition retain the transported geometric chart.
 * @evidence contracts/common.md#clear-and-simple-design Row quantities remain separate from transport admission, anchor correspondence and point provenance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An inserted PL seam is identified separately by transport provenance rather than asserted to be an original observation.
 * @evidence contracts/common.md#meaningful-documentation Defines millimetres, same-order arrays, phase endpoint and feature-index ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased result contract performs no transport.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the returned row arrays.
 */
export interface IAutoMovieRecoveryTransportedObservationRow {
  /** Name retained from the current observation chart. */
  name: string;

  /** Fresh physical points in millimetres, without a repeated terminal point. */
  pointsMm: C.Vector[];

  /** Same-order persistent identities; a virtual seam has null identity. */
  anchorIds: (string | null)[];

  /** Zero-based indices of retained corner requests in this output row. */
  corners: number[];

  /** Zero-based output sampling requests, including the canonical seam at index zero. */
  schedule: number[];

  /** Same-order unit directions, preserving independent sides at corners. */
  tangents: IAutoMovieRecoveryObservationTangents[];

  /** Strictly increasing point phases from 0, followed by terminal 1. */
  phase: number[];
}
