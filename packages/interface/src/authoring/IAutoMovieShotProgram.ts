import { IAutoMovieScript } from "../harness/IAutoMovieScript";
import { IAutoMovieBlocking } from "./IAutoMovieBlocking";
import { IAutoMoviePerformance } from "./IAutoMoviePerformance";
import { IAutoMovieShotActorProgram } from "./IAutoMovieShotActorProgram";
import { IAutoMovieStage } from "./IAutoMovieStage";

/**
 * Context-free shot program returned by a registered source builder.
 *
 * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-author-authority Exposes `IAutoMovieShotProgram` as the portable data boundary for the coding agent's authority to choose technique, structure, and parameters within the public contract.
 * @evidence requirements/agent-authoring/source-owned-loop.md#agent-ordinary-code-authoring Exposes `IAutoMovieShotProgram` as the portable data boundary for the agent ordinary code authoring requirement.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Types `IAutoMovieShotProgram` for the spec authoring source input system contract.
 */
export interface IAutoMovieShotProgram {
  /**
   * Runtime facts for every articulated stage actor that performs a verb.
   *
   * Geometry and gait curves remain builder-owned through {@link model}; the
   * source states only the scale-dependent values a generic builder cannot
   * infer without guessing.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-ordinary-code-authoring Exposes `actors` as the portable data boundary for the agent ordinary code authoring requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Types `actors` for the spec authoring source input system contract.
   */
  actors: IAutoMovieShotActorProgram[];

  /**
   * Macro treatment containing the registered beat.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-ordinary-code-authoring Exposes `script` as the portable data boundary for the agent ordinary code authoring requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Types `script` for the spec authoring source input system contract.
   */
  script: IAutoMovieScript;

  /**
   * Set declaration whose scene id must equal the registration's scene.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-ordinary-code-authoring Exposes `stage` as the portable data boundary for the agent ordinary code authoring requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Types `stage` for the spec authoring source input system contract.
   */
  stage: IAutoMovieStage;

  /**
   * Checked intent that the action program must realize.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-ordinary-code-authoring Exposes `blocking` as the portable data boundary for the agent ordinary code authoring requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Types `blocking` for the spec authoring source input system contract.
   */
  blocking: IAutoMovieBlocking;

  /**
   * Thin verb program compiled by the engine.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-ordinary-code-authoring Exposes `performance` as the portable data boundary for the agent ordinary code authoring requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Types `performance` for the spec authoring source input system contract.
   */
  performance: IAutoMoviePerformance;

  /**
   * One authoritative sample time for every declared semantic event.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-ordinary-code-authoring Exposes `eventSamples` as the portable data boundary for the agent ordinary code authoring requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Types `eventSamples` for the spec authoring source input system contract.
   */
  eventSamples: Array<{
    /** Event-contract identity. */
    id: string;

    /** Shot-local measurement time in seconds. */
    time: number;
  }>;
}
