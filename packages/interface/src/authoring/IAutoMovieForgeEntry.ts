import { IAutoMovieModel } from "../model/IAutoMovieModel";

/**
 * One cast node and the generated rig that embodies it.
 *
 * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `IAutoMovieForgeEntry` as the portable data boundary for the agent authoring tool replaceability requirement.
 * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `IAutoMovieForgeEntry` for the spec authoring authority compatibility system contract.
 */
export interface IAutoMovieForgeEntry {
  /**
   * Script cast node; the model id must equal this join key.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `node` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `node` for the spec authoring authority compatibility system contract.
   */
  node: string;
  /**
   * Generated model whose skeleton and geometry pass engine validation.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `model` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `model` for the spec authoring authority compatibility system contract.
   */
  model: IAutoMovieModel;
}
