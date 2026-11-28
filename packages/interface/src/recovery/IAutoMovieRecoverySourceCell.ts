/**
 * One closed scalar clip of an original source triangle, retaining affine
 * incidence and source rank.
 */
export interface IAutoMovieRecoverySourceCell {
  /** Index of the cell in this query's clipped population. */
  id: number;

  /** Original source triangle ordinal supplying this cell. */
  face: number;

  /**
   * Abstract clipped reference-triangle dimension, including point and edge
   * contacts.
   */
  dimension: 0 | 1 | 2;

  /** Physical rank of the original registered triangle's geometry. */
  sourceGeometryRank: 0 | 1 | 2;

  /**
   * Whether the source varies, lies flat in or at a bound, or only contacts a
   * bound.
   */
  scalarKind:
    | "varying"
    | "flat-interior"
    | "flat-before"
    | "flat-after"
    | "boundary-contact";

  /** Physical ownership address by open interval or exact boundary plane. */
  stratum:
    | {
        /** Interval ownership of an interior or varying clipped source cell. */
        kind: "open-slab";
        /** Lower physical boundary of the owning scalar interval in millimetres. */
        beforeMm: number;
        /** Upper physical boundary of the owning scalar interval in millimetres. */
        afterMm: number;
      }
    | {
        /**
         * Ownership by an exact physical plane for a flat bound or boundary
         * contact.
         */
        kind: "plane";
        /**
         * Physical millimetre coordinate at which this cell's scalar stratum
         * lies.
         */
        coordinateMm: number;
      };

  /** Ordered original node IDs around the clipped reference cell. */
  nodes: string[];

  /** Assigned dimension-two component ID, or null for isolated contacts. */
  component: number | null;

  /** Resolved orientation parity flip, or null where qualification is absent. */
  orientationFlip: boolean | null;
}
