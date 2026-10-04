/**
 * An explicit statement that no validated geometry was generated.
 *
 * Inspection and export records carry it wherever a whole skin or complete
 * anatomical part is not produced, so a candidate sphere or reference rig can
 * never stand in for an independently validated surface.
 *
 * @evidence contracts/common.md#principled-implementation Unavailable anatomy keeps its own status and reason instead of being represented by a candidate or neutral.
 * @evidence contracts/common.md#clear-and-simple-design One named status record replaces the repeated anonymous unavailable-geometry literal of inspection and export.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No cohort, error or tissue surface is invented for the unavailable output.
 * @evidence contracts/common.md#meaningful-documentation States what is unavailable and why the record exists.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The enclosing record names the part this status concerns.
 * @evidenceExclude contracts/modeling.md#parameter-channels A status defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record states that no geometry was emitted.
 * @evidenceExclude contracts/modeling.md#spatial-conventions A status carries no coordinate.
 * @evidenceExclude contracts/modeling.md#shared-boundaries A status constructs no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The candidate model owner observes the displayed mesh.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The status asserts the absence of validated anatomy, not an anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range A status bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority A status is not a person-authoring input.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyUnvalidatedGeometry {
  /** No validated individual component was generated. */
  status: "unavailable";

  /** The geometry was not validated against independently observed anatomy. */
  reason: "geometry-not-validated";
}
