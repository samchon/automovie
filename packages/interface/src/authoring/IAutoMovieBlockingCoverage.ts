import { IAutoMovieBlockingCamera } from "./IAutoMovieBlockingCamera";

/**
 * One additional take and the staged camera that owns it.
 *
 * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `IAutoMovieBlockingCoverage` as the portable data boundary for the agent authoring tool replaceability requirement.
 * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `IAutoMovieBlockingCoverage` for the spec authoring authority compatibility system contract.
 */
export interface IAutoMovieBlockingCoverage extends IAutoMovieBlockingCamera {
  /**
   * Distinct staged camera identity for this take.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `camera` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `camera` for the spec authoring authority compatibility system contract.
   */
  camera: string;
}
