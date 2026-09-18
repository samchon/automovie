import { IAutoMovieDefinedShotContract } from "./IAutoMovieDefinedShotContract";
import { IAutoMovieShotProgram } from "./IAutoMovieShotProgram";

/**
 * One source-level shot registration.
 *
 * The export is the artifact: id, staged scene, measurable contract, and
 * deterministic builder travel together so a repository builder can bind
 * module path, export name, and artifact identity without a second manifest
 * claiming what the source contains.
 *
 * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `IAutoMovieDefinedShot` as the portable data boundary for the agent source result link requirement.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `IAutoMovieDefinedShot` for the spec authoring source derivation state system contract.
 */
export interface IAutoMovieDefinedShot<Context = undefined> {
  /**
   * Stable shot id; the compiled artifact receives this exact identity.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `id` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `id` for the spec authoring source derivation state system contract.
   */
  id: string;
  /**
   * Stable staged-scene id the builder must actually produce.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `scene` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `scene` for the spec authoring source derivation state system contract.
   */
  scene: string;
  /**
   * Required participants, states, events, coverage, and review evidence.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `contract` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `contract` for the spec authoring source derivation state system contract.
   */
  contract: IAutoMovieDefinedShotContract;
  /**
   * Free deterministic code that emits the typed engine program.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `build` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `build` for the spec authoring source derivation state system contract.
   */
  build(context: Context): IAutoMovieShotProgram;
}
