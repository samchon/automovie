/**
 * The performed tongue's passage through the selected oral plane, measured
 * on its corrected surface. Omission retains the legacy incisal measurement;
 * generated oral mode selects the actual lower-lip port.
 * Extent and slab thickness remain metres in the contact frame; the report
 * does not reconstruct muscular anatomy or certify visual acceptance.
 *
 * @evidence contracts/common.md#principled-implementation Legacy passage reads the actual tongue triangle/slab section against incisal/lip apertures; generated oral mode uses the lower-lip port's projected opening and retained-crown crossing identities before emitting its lip-port-qualified summary.
 * @evidence contracts/common.md#clear-and-simple-design Optional plane qualification distinguishes the two existing protocols while metre protrusion and section thickness retain one result shape.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A protruding tongue with no slab section refuses, and generated passage retains baseline crown crossings by exact pair identity; these coarse projected checks do not certify full 3D seal, constant volume, physiological passage or appearance.
 * @evidence contracts/common.md#meaningful-documentation Plane omission, corrected-surface scope and metre extent/thickness state the actual measured geometric report rather than a clinical incisal acquisition.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This summary performs no slab clipping, opening containment or crossing query.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reference crossing identity belongs to the evaluator, not cached work in this output.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Report scalars retain no tongue mesh or crown collider.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceTonguePassageSummary {
  /** Omission retains legacy incisal-plane measurement; generated oral mode reads the actual lip port. */
  plane?: "lip-port";

  /** Anterior extent past the selected incisal plane or lip port, metres. */
  protrudingMetres: number;

  /** Thickness over the selected incisal or lip-port section slab, metres. */
  thicknessMetres: number;
}
