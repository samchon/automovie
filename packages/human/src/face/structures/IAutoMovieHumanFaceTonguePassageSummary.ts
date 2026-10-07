/**
 * The performed tongue's incisal passage, measured on its corrected surface.
 * Extent and slab thickness remain metres in the contact frame; the report
 * does not reconstruct muscular anatomy or certify visual acceptance.
 *
 * @evidence contracts/common.md#principled-implementation Carries two measured quantities of one performed passage without altering them.
 * @evidence contracts/common.md#clear-and-simple-design One extent and one slab thickness.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No expected or absent passage value is substituted.
 * @evidence contracts/common.md#meaningful-documentation States the stage, unit and limits.
 * @evidence contracts/modeling.md#spatial-conventions Both quantities are metres in the oral contact frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The report creates no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The report moves no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The report emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The report creates no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The passage and contact owners observe the corrected geometry.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The passage owner states its modelled extent and qualification.
 * @evidenceExclude contracts/anatomy.md#permitted-range Contact admits the passage, not this result record.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The report is output, not an authoring control.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceTonguePassageSummary {
  /** Omission retains legacy incisal-plane measurement; generated oral mode reads the actual lip port. */
  plane?: "lip-port";
  /** Anterior extent past the incisal plane, metres. */
  protrudingMetres: number;

  /** Thickness over the registered incisal slab, metres. */
  thicknessMetres: number;
}
