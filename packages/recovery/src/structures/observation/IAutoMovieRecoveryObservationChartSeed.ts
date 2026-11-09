import type { IAutoMovieCurve64 as C } from "@automovie/engine";

/**
 * Incoming closed observation cycle and its optional authoritative phase chart.
 *
 * @evidence contracts/development/design.md#principled-representation Persistent identities and an optional increasing periodic phase partition provide the incoming authority for geometric transport.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The seed is independent of current-row feature requests and the admitted transport result.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing phase requests physical PL arclength seeding, not invented material correspondence.
 * @evidence contracts/development/common.md#meaningful-documentation States millimetres, borrowed arrays, null identity and the optional periodic phase convention.
 */
export interface IAutoMovieRecoveryObservationChartSeed {
  /** Borrowed closed-cycle points in millimetres, without repeating the first point. */
  pointsMm: readonly C.Vector[];

  /** Same-order persistent identities; null means no declared identity. */
  anchorIds: readonly (string | null)[];

  /** Optional point phases followed by terminal 1; strictly increasing from 0. Omission seeds normalized physical PL arclength. */
  phase?: readonly number[];
}
