import type { IHumanObservationMaterialParameters } from "./IHumanObservationMaterialParameters.js";

/**
 * The shared meaning and material of one human observation pass.
 *
 * `reading` states what the pass judges and what it does not; `lightScope`
 * says whether the authored lights illuminate it. The reading and material
 * belong together so display clients cannot rename a diagnostic.
 *
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
