/**
 * Conservative extent of contact between a complete anchored fan and one
 * support triangle.
 *
 * The support's stored face direction is scaled to a maximum component
 * magnitude of one. Corner gap and root deficit use the resulting projection
 * unit. A collapsed support returns a failed proof with zero quantities. A
 * nonpositive resolved gap retains the measured gap and deficit for diagnosis.
 */
export interface IAutoMovieTriangleAttachmentContactBound {
  /**
   * True when the slab gap proves that the reported cap encloses every possible
   * fan contact on the support.
   */
  proved: boolean;

  /**
   * Outward upper distance bound in metres from the root to any possible
   * contact. The zero in an unproved receipt carries no contact bound.
   */
  cap: number;

  /**
   * Outward lower enclosure of the smaller non-root corner height above the
   * slab top, in scaled projection units.
   */
  cornerGap: number;

  /**
   * Outward upper enclosure of the nonnegative deficit from the root to the
   * slab top, in the same scaled projection units.
   */
  rootDeficit: number;
}
