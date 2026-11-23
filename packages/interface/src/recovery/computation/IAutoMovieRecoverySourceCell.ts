/**
 * One original triangle's intersection with a closed scalar slab. Dimension,
 * source rank and plane/open-slab strata retain lower-dimensional contacts.
 * Coordinates are registered millimetres; query-local component and orientation
 * remain nullable until qualified.
 */
export interface IAutoMovieRecoverySourceCell {
  /**
   * Zero-based ordinal in this record's owning cell, component or control
   * registry; it is not a source coordinate.
   */
  id: number;

  /**
   * Original source-triangle ordinal, preserved through observation and
   * subdivision.
   */
  face: number;

  /**
   * Dimension in the source triangle's reference domain, independently of
   * geometric rank.
   */
  dimension: 0 | 1 | 2;

  /**
   * Exact affine rank of the original face, not the physical dimension of a
   * contact cell.
   */
  sourceGeometryRank: 0 | 1 | 2;

  /**
   * Whether the source cell varies through the interval, lies on an interior or
   * endpoint plane, or is a boundary contact.
   */
  scalarKind:
    | "varying"
    | "flat-interior"
    | "flat-before"
    | "flat-after"
    | "boundary-contact";

  /**
   * One plane registry must own on-plane faces/contacts when adjacent query
   * results are combined.
   */
  stratum:
    | {
        /**
         * Closed representation discriminator selecting the corresponding
         * observation or result arm.
         */
        kind: "open-slab";
        /**
         * Lower physical sweep coordinate in registered millimetres; paired
         * with the strictly greater afterMm.
         */
        beforeMm: number;
        /**
         * Upper physical sweep coordinate in registered millimetres; paired
         * with the strictly smaller beforeMm.
         */
        afterMm: number;
      }
    | {
        /**
         * Closed representation discriminator selecting the corresponding
         * observation or result arm.
         */
        kind: "plane";
        /**
         * Signed section-plane coordinate along the registered unit sweep axis,
         * in millimetres.
         */
        coordinateMm: number;
      };

  /**
   * Observed boundary-node identities in traversal order; repeated physical
   * positions retain separate incidence when declared.
   */
  nodes: string[];

  /**
   * Query-local component ordinal; null, where allowed, means the cell has no
   * two-dimensional component.
   */
  component: number | null;

  /**
   * Relative face reorientation for a qualified orientable sheet, never an
   * outward-normal claim.
   */
  orientationFlip: boolean | null;
}
