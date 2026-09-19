import { IAutoMovieForgeEntry } from "./IAutoMovieForgeEntry";

/**
 * Coding-agent-authored stand-in model inventory for a script cast.
 *
 * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `IAutoMovieForgePlan` as the portable data boundary for the agent authoring tool replaceability requirement.
 * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `IAutoMovieForgePlan` for the spec authoring authority compatibility system contract.
 */
export interface IAutoMovieForgePlan {
  /**
   * Exactly one generated stand-in for every cast member without a model.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `entries` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `entries` for the spec authoring authority compatibility system contract.
   */
  entries: IAutoMovieForgeEntry[];
}
