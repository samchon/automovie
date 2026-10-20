import type { IAutoMovieCurve64 as C } from "@automovie/engine/geometry/curve";

/**
 * Incoming closed observation cycle and its optional authoritative phase chart.
 *
 * @evidence contracts/common.md#principled-implementation Persistent identities and an optional increasing periodic phase partition provide the incoming authority for geometric transport.
 * @evidence contracts/common.md#clear-and-simple-design The seed is independent of current-row feature requests and the admitted transport result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing phase requests physical PL arclength seeding, not invented material correspondence.
 * @evidence contracts/common.md#meaningful-documentation States millimetres, borrowed arrays, null identity and the optional periodic phase convention.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased input contract performs no traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Arrays remain borrowed from the caller during synchronous transport.
 */
export interface IAutoMovieRecoveryObservationChartSeed {
  /** Borrowed closed-cycle points in millimetres, without repeating the first point. */
  pointsMm: readonly C.Vector[];

  /** Same-order persistent identities; null means no declared identity. */
  anchorIds: readonly (string | null)[];

  /** Optional point phases followed by terminal 1; strictly increasing from 0. Omission seeds normalized physical PL arclength. */
  phase?: readonly number[];
}
