import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieMountBinding } from "../harness/IAutoMovieMountBinding";

/**
 * One scripted actor's initial world placement and persistent coupling.
 *
 * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `IAutoMovieStageActor` as the portable data boundary for the agent authoring tool replaceability requirement.
 * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `IAutoMovieStageActor` for the spec authoring authority compatibility system contract.
 */
export interface IAutoMovieStageActor {
  /**
   * Script cast id; this is also the scene-node identity.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `node` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `node` for the spec authoring authority compatibility system contract.
   */
  node: string;

  /**
   * Initial root position in world meters.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `position` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `position` for the spec authoring authority compatibility system contract.
   */
  position: IAutoMovieVector3;

  /**
   * Initial heading in degrees about +Y, where zero faces +Z.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `facingDeg` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `facingDeg` for the spec authoring authority compatibility system contract.
   */
  facingDeg: number;

  /**
   * Film-persistent mount carried through beat-end continuity, when present.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `attach` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `attach` for the spec authoring authority compatibility system contract.
   */
  attach?: IAutoMovieMountBinding;
}
