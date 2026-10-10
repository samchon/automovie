/**
 * An explicit statement that no validated geometry was generated.
 *
 * Inspection and export records carry it wherever a whole skin or complete
 * anatomical part is not produced, so a candidate sphere or reference rig can
 * never stand in for an independently validated surface.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyUnvalidatedGeometry {
  /** No validated individual component was generated. */
  status: "unavailable";

  /** The geometry was not validated against independently observed anatomy. */
  reason: "geometry-not-validated";
}
