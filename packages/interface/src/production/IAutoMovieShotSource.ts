import { IAutoMovieDefinedShot } from "../authoring/IAutoMovieDefinedShot";
import { IAutoMovieProductionShotProgram } from "./IAutoMovieProductionShotProgram";
import { IAutoMovieShotBuildContext } from "./IAutoMovieShotBuildContext";

/**
 * Coding-agent-owned module export compiled in a deterministic sandbox.
 *
 * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `IAutoMovieShotSource` as the portable data boundary for the agent source result link requirement.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `IAutoMovieShotSource` for the spec authoring source derivation state system contract.
 */
export interface IAutoMovieShotSource {
  /**
   * Exact registered shot id selected by the design source pointer.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `id` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `id` for the spec authoring source derivation state system contract.
   */
  id: IAutoMovieDefinedShot<IAutoMovieShotBuildContext>["id"];
  /**
   * Exact staged-scene id the returned program must author.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `scene` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `scene` for the spec authoring source derivation state system contract.
   */
  scene: IAutoMovieDefinedShot<IAutoMovieShotBuildContext>["scene"];
  /**
   * Measurable source-owned contract, checked against the design contract.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `contract` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `contract` for the spec authoring source derivation state system contract.
   */
  contract: IAutoMovieDefinedShot<IAutoMovieShotBuildContext>["contract"];
  /**
   * Build a thin stage/block/performance program.
   *
   * The production host, not source code, supplies rig capabilities and runs
   * the engine pipeline that lowers this program into scene, motion, and shot
   * artifacts.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `build` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `build` for the spec authoring source derivation state system contract.
   */
  build(context: IAutoMovieShotBuildContext): IAutoMovieProductionShotProgram;
}
