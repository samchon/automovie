import type { IAutoMovieHumanBodyAnatomicalInspection } from "../generated/IAutoMovieHumanBodyAnatomicalInspection";

/**
 * Inputs of `createHumanBodyArticularCandidateModel`.
 *
 * `id` and `name` label the produced static model; `inspection` is the
 * generated report whose candidates become its spheres. The report is read
 * only and no whole body skin is substituted for its unavailable outputs.
 *
 * @evidence contracts/common.md#principled-implementation The model is drawn from the generated inspection report alone, so displayed spheres match the computed candidates.
 * @evidence contracts/common.md#clear-and-simple-design One named props record replaces the adapter's anonymous parameter type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No personal mesh or skin is accepted beside the report.
 * @evidence contracts/common.md#meaningful-documentation States each field's role and the report's read-only use.
 * @evidence contracts/modeling.md#part-identity-and-grouping The model ID and name label the static model whose parts are the inspected head candidates.
 * @evidenceExclude contracts/modeling.md#parameter-channels The props define no authoring channel; candidates are computed output.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The adapter emits the sphere meshes.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The report states its own frame and units.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Independent spheres make no tissue join.
 * @evidenceExclude contracts/modeling.md#rendered-observation The numerical request page observes the displayed model.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The props carry no anatomical value of their own.
 * @evidenceExclude contracts/anatomy.md#permitted-range The inspector owns admission.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The props consume a generated report, not a personal authored mesh.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyArticularCandidateModelProps {
  /** Identity of the produced static model. */
  id: string;

  /** Display name of the produced static model. */
  name: string;

  /** Generated inspection report whose candidates become the spheres. */
  inspection: IAutoMovieHumanBodyAnatomicalInspection;
}
