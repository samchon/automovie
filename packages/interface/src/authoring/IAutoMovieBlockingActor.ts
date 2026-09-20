import { IAutoMovieTimingAnchor } from "../harness/IAutoMovieTimingAnchor";

/**
 * One actor's ordered prose intent and sparse authoritative moments.
 *
 * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `IAutoMovieBlockingActor` as the portable data boundary for the agent authoring tool replaceability requirement.
 * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `IAutoMovieBlockingActor` for the spec authoring authority compatibility system contract.
 */
export interface IAutoMovieBlockingActor {
  /**
   * Staged actor node.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `node` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `node` for the spec authoring authority compatibility system contract.
   */
  node: string;

  /**
   * Ordered action intent; dense motion remains engine-owned.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `beats` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `beats` for the spec authoring authority compatibility system contract.
   */
  beats: string;

  /**
   * Sparse causal anchors the action spans must cover in listed order.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `anchors` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `anchors` for the spec authoring authority compatibility system contract.
   */
  anchors?: IAutoMovieTimingAnchor[];
}
