import type { IAutoMovieRecoveryChartBatch } from "..";

/**
 * Prepared chart awaiting the common boundary-network fit and atlas
 * publication. The slab bounds are registered millimetres and
 * interval/component are observation ordinals. Source faces and construction
 * metadata remain private; outcomes is the same mutable array held by the
 * observation ledger.
 */
export type IAutoMovieRecoveryPendingChartObservation = {
  /**
   * Prepared or fitted chart record whose source correspondence and coefficient
   * authority remain separately qualified.
   */
  chart: Parameters<IAutoMovieRecoveryChartBatch.Operation>[0]["charts"][number];

  /**
   * Ordinal of the adjacent saved-plane interval in the complete observation
   * sequence.
   */
  interval: number;

  /**
   * Lower physical sweep coordinate in registered millimetres; paired with the
   * strictly greater afterMm.
   */
  beforeMm: number;

  /**
   * Upper physical sweep coordinate in registered millimetres; paired with the
   * strictly smaller beforeMm.
   */
  afterMm: number;

  /**
   * Query-local ordinal of the two-dimensional source component owning this
   * chart.
   */
  component: number;

  /** Original source-face ordinals belonging to this observed chart or feature. */
  sourceFaces: number[];

  /**
   * Stable identity of the original observed chart before feature-driven
   * subdivision.
   */
  sourceChart: string;

  /**
   * Optional disk-parameterization construction metadata; null means this chart
   * used no such record.
   */
  diskConstruction: object | null;

  /**
   * Whether the supplied external boundary coefficients passed the observation
   * owner's authority checks.
   */
  externalBoundaryAuthorityQualified: boolean;

  /**
   * Caller-owned mutable diagnostic ledger entries; these are metadata and
   * never interpreted as generated geometry.
   */
  outcomes: object[];
};
