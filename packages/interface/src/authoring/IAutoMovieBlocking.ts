import { IAutoMovieBlockingActor } from "./IAutoMovieBlockingActor";
import { IAutoMovieBlockingCamera } from "./IAutoMovieBlockingCamera";
import { IAutoMovieBlockingCoverage } from "./IAutoMovieBlockingCoverage";

/**
 * Models one shot's intent before dense motion is synthesized.
 *
 * The engine checks this plan against script, stage, prior beat state and the
 * final action program. Prose explains craft; typed anchors and camera fields
 * carry the facts that can be checked deterministically.
 *
 * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `IAutoMovieBlocking` as the portable data boundary for the agent authoring tool replaceability requirement.
 * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `IAutoMovieBlocking` for the spec authoring authority compatibility system contract.
 */
export interface IAutoMovieBlocking {
  /**
   * Script beat identity realized by this plan.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `beat` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `beat` for the spec authoring authority compatibility system contract.
   */
  beat: string;

  /**
   * Dramatic purpose used by later visual review.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `analysis` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `analysis` for the spec authoring authority compatibility system contract.
   */
  analysis: string;

  /**
   * Why the chosen placement, coverage and timing serve that purpose.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `rationale` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `rationale` for the spec authoring authority compatibility system contract.
   */
  rationale: string;

  /**
   * Actor-local intent and optional causal timing anchors.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `actors` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `actors` for the spec authoring authority compatibility system contract.
   */
  actors: IAutoMovieBlockingActor[];

  /**
   * Hero camera coverage the action program must realize.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `camera` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `camera` for the spec authoring authority compatibility system contract.
   */
  camera: IAutoMovieBlockingCamera;

  /**
   * Additional independently renderable camera takes.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `coverage` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `coverage` for the spec authoring authority compatibility system contract.
   */
  coverage?: IAutoMovieBlockingCoverage[];

  /**
   * Positive shot-local duration in seconds.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `duration` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `duration` for the spec authoring authority compatibility system contract.
   */
  duration: number;
}
