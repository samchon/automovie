import { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One non-performing piece of visible environment geometry.
 *
 * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `IAutoMovieStageSetPiece` as the portable data boundary for the agent authoring tool replaceability requirement.
 * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `IAutoMovieStageSetPiece` for the spec authoring authority compatibility system contract.
 */
export interface IAutoMovieStageSetPiece {
  /**
   * Unique scene-node identity.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `node` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `node` for the spec authoring authority compatibility system contract.
   */
  node: string;
  /**
   * Runtime model identity used to render the piece.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `model` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `model` for the spec authoring authority compatibility system contract.
   */
  model: string;
  /**
   * World-space placement in meters.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `position` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `position` for the spec authoring authority compatibility system contract.
   */
  position: IAutoMovieVector3;
  /**
   * Optional heading in degrees about +Y.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `facingDeg` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `facingDeg` for the spec authoring authority compatibility system contract.
   */
  facingDeg?: number;
  /**
   * Optional full world rotation for sloped, vertical, or arbitrarily oriented
   * architecture. Mutually exclusive with the simpler `facingDeg` spelling.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `rotation` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `rotation` for the spec authoring authority compatibility system contract.
   */
  rotation?: IAutoMovieQuaternion;
  /**
   * Positive uniform or per-axis scale applied to the model.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `scale` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `scale` for the spec authoring authority compatibility system contract.
   */
  scale?: number | IAutoMovieVector3;
}
