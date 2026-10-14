/**
 * An explicit statement that no validated geometry was generated.
 *
 * Inspection and export records carry it wherever a whole skin or complete anatomical part is not produced, so a candidate sphere or reference rig can never stand in for an independently validated surface.
 *
 * @evidence contracts/common.md#principled-implementation An unavailable/geometry-not-validated pair explicitly denies independently validated component generation in inspection/export records.
 * @evidence contracts/common.md#clear-and-simple-design A minimal qualification record separates candidate spheres/reference rigs from validated anatomical surfaces.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rendering or placement cannot substitute for independently observed surface validation.
 * @evidence contracts/common.md#meaningful-documentation Comments state absence of validated individual geometry and the required independent comparison.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Unvalidated-status data performs no geometric or scientific validation algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The qualification pair retains no previously completed surface-validation work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Unavailable geometry markers own no substitute mesh or retained inspector.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyUnvalidatedGeometry {
  /** No validated individual component was generated. */
  status: "unavailable";

  /** The geometry was not validated against independently observed anatomy. */
  reason: "geometry-not-validated";
}
