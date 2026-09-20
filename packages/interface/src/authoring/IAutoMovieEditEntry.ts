import { IAutoMovieTransition } from "../cinematics/IAutoMovieTransition";
import { IAutoMovieTrim } from "../cinematics/IAutoMovieTrim";

/**
 * One shot placement in the finished edit.
 *
 * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `IAutoMovieEditEntry` as the portable data boundary for the agent authoring tool replaceability requirement.
 * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `IAutoMovieEditEntry` for the spec authoring authority compatibility system contract.
 */
export interface IAutoMovieEditEntry {
  /**
   * Existing compiled shot identity.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `shot` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `shot` for the spec authoring authority compatibility system contract.
   */
  shot: string;

  /**
   * Optional positive source subrange.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `trim` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `trim` for the spec authoring authority compatibility system contract.
   */
  trim: IAutoMovieTrim | null;

  /**
   * Incoming transition, or null for a hard cut.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `transition` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `transition` for the spec authoring authority compatibility system contract.
   */
  transition: IAutoMovieTransition | null;
}
