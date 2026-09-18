import { IAutoMovieDefinedShotContract } from "./IAutoMovieDefinedShotContract";
import { IAutoMovieShotProgram } from "./IAutoMovieShotProgram";

/**
 * The source-authored half accepted by the engine's `defineShot` helper.
 *
 * @evidence requirements/agent-authoring/source-owned-loop.md#agent-ordinary-code-authoring Exposes `IAutoMovieShotDefinition` as the portable data boundary for the agent ordinary code authoring requirement.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Types `IAutoMovieShotDefinition` for the spec authoring source input system contract.
 */
export interface IAutoMovieShotDefinition<Context> {
  /**
   * Stable staged-scene id the builder must actually produce.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-ordinary-code-authoring Exposes `scene` as the portable data boundary for the agent ordinary code authoring requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Types `scene` for the spec authoring source input system contract.
   */
  scene: string;
  /**
   * Required participants, states, events, coverage, and review evidence.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-ordinary-code-authoring Exposes `contract` as the portable data boundary for the agent ordinary code authoring requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Types `contract` for the spec authoring source input system contract.
   */
  contract: IAutoMovieDefinedShotContract;
  /**
   * Free deterministic code that emits the typed engine program.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-ordinary-code-authoring Exposes `build` as the portable data boundary for the agent ordinary code authoring requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Types `build` for the spec authoring source input system contract.
   */
  build(context: Context): IAutoMovieShotProgram;
}
