export namespace PhysicalShapeGjkImplementationData {
  /*
   * The bounds' gap under which the iteration has converged, metres: a nanometre,
   * the depth below which the penetration audits record nothing
   * (`AutoMovieMotionHumanAuditTangleMargin.NANOMETRE`).
   */
  export const GAP: number = 1e-9;

  /*
   * A distance under which the cores' difference is taken to hold the origin,
   * metres: far below the gap, far above a metre's rounding (about 1e-16 m).
   */
  export const ZERO: number = 1e-12;
}
