import { IAutoMovieNamedId } from "../core/IAutoMovieNamedId";
import { IAutoMovieEditEntry } from "./IAutoMovieEditEntry";

/**
 * Coding-agent-owned edit over already validated shot artifacts.
 *
 * @evidence requirements/agent-authoring/source-owned-loop.md#agent-ordinary-code-authoring Exposes `IAutoMovieEditPlan` as the portable data boundary for the agent ordinary code authoring requirement.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Types `IAutoMovieEditPlan` for the spec authoring source input system contract.
 */
export interface IAutoMovieEditPlan {
  /**
   * Stable finished-film identity and optional display name.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-ordinary-code-authoring Exposes `sequence` as the portable data boundary for the agent ordinary code authoring requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Types `sequence` for the spec authoring source input system contract.
   */
  sequence: IAutoMovieNamedId;
  /**
   * Positive playback frame rate.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-ordinary-code-authoring Exposes `fps` as the portable data boundary for the agent ordinary code authoring requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Types `fps` for the spec authoring source input system contract.
   */
  fps: number;
  /**
   * Shot placements in playback order.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-ordinary-code-authoring Exposes `entries` as the portable data boundary for the agent ordinary code authoring requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Types `entries` for the spec authoring source input system contract.
   */
  entries: IAutoMovieEditEntry[];
  /**
   * Why the trims and transitions serve the film's rhythm.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-ordinary-code-authoring Exposes `pacing` as the portable data boundary for the agent ordinary code authoring requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Types `pacing` for the spec authoring source input system contract.
   */
  pacing: string;
  /**
   * How adjacent opening/end states connect across each cut.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-ordinary-code-authoring Exposes `continuity` as the portable data boundary for the agent ordinary code authoring requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Types `continuity` for the spec authoring source input system contract.
   */
  continuity: string;
}
