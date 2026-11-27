import type { AutoMovieVector3Tuple } from "..";

/** Incoming closed observation cycle and its optional authoritative phase chart. */
export interface IAutoMovieRecoveryObservationChartSeed {
  /**
   * Borrowed closed-cycle points in millimetres, without repeating the first
   * point.
   */
  pointsMm: readonly Readonly<AutoMovieVector3Tuple>[];

  /** Same-order persistent identities; null means no declared identity. */
  anchorIds: readonly (string | null)[];

  /**
   * Optional point phases followed by terminal 1; strictly increasing from 0.
   * Omission seeds normalized physical PL arclength.
   */
  phase?: readonly number[];
}
