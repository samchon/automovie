import { IAutoMovieActionCall } from "../harness/IAutoMovieActionCall";

/**
 * Thin verb program compiled into one dense, ROM-checked shot.
 *
 * {@link draft} is the first complete program and {@link revise} records the code
 * author's own correction decision. The engine executes exactly {@code
 * revise.final ?? draft}; handwritten keyframes remain available only through
 * the explicit {@code enact} escape hatch.
 *
 * @evidence requirements/agent-authoring/source-owned-loop.md#agent-ordinary-code-authoring Exposes `IAutoMoviePerformance` as the portable data boundary for the agent ordinary code authoring requirement.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Types `IAutoMoviePerformance` for the spec authoring source input system contract.
 */
export interface IAutoMoviePerformance {
  /**
   * Script beat and registered shot identity realized by this program.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-ordinary-code-authoring Exposes `beat` as the portable data boundary for the agent ordinary code authoring requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Types `beat` for the spec authoring source input system contract.
   */
  beat: string;
  /**
   * How the intended action decomposes into engine verbs and timing.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-ordinary-code-authoring Exposes `plan` as the portable data boundary for the agent ordinary code authoring requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Types `plan` for the spec authoring source input system contract.
   */
  plan: string;
  /**
   * First complete action program, including camera actions.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-ordinary-code-authoring Exposes `draft` as the portable data boundary for the agent ordinary code authoring requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Types `draft` for the spec authoring source input system contract.
   */
  draft: IAutoMovieActionCall[];
  /**
   * Auditable self-review and optional corrected program.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-ordinary-code-authoring Exposes `revise` as the portable data boundary for the agent ordinary code authoring requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Types `revise` for the spec authoring source input system contract.
   */
  revise: {
    /** Range, causality, region, camera and timing assessment. */
    review: string;
    /** Corrected action program, or null when the draft already stands. */
    final: IAutoMovieActionCall[] | null;
  };
  /**
   * Positive shot-local duration in seconds.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-ordinary-code-authoring Exposes `duration` as the portable data boundary for the agent ordinary code authoring requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Types `duration` for the spec authoring source input system contract.
   */
  duration: number;
}
