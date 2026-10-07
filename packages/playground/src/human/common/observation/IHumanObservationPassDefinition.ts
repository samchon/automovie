import type { IHumanObservationMaterialParameters } from "./IHumanObservationMaterialParameters";

/**
 * The shared meaning and material of one human observation pass.
 *
 * `reading` states what the pass judges and what it does not; `lightScope`
 * says whether the authored lights illuminate it. The reading and material
 * belong together so display clients cannot rename a diagnostic.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Distinguishes material readings from geometric observations in face review.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Pairs each pass's observation limits with its actual material parameters.
 * @author Samchon
 */
export interface IHumanObservationPassDefinition {
  /** What the pass judges and its observation limits. */
  reading: string;

  /** Whether the authored lights illuminate the pass. */
  lightScope: "authored" | "none";

  /** Material parameters applied to every displayed mesh. */
  parameters: IHumanObservationMaterialParameters;
}
