import { IAutoMovieNodeTarget } from "../harness/IAutoMovieNodeTarget";
import { IAutoMoviePointTarget } from "../harness/IAutoMoviePointTarget";

/**
 * Camera grammar shared by hero and alternate takes.
 *
 * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `IAutoMovieBlockingCamera` as the portable data boundary for the agent authoring tool replaceability requirement.
 * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `IAutoMovieBlockingCamera` for the spec authoring authority compatibility system contract.
 */
export interface IAutoMovieBlockingCamera {
  /**
   * Shot size the compiled camera must deliver.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `framing` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `framing` for the spec authoring authority compatibility system contract.
   */
  framing: "wide" | "full" | "medium" | "close";
  /**
   * Deterministic move family.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `move` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `move` for the spec authoring authority compatibility system contract.
   */
  move: "static" | "follow" | "orbit" | "push-in" | "truck" | "whip";
  /**
   * Staged node or literal point the camera must favor.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `on` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `on` for the spec authoring authority compatibility system contract.
   */
  on: IAutoMovieNodeTarget | IAutoMoviePointTarget;
}
