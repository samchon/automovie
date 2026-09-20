import { AutoMovieFilmTime } from "./AutoMovieFilmTime";
import { IAutoMovieFilmTransition } from "./IAutoMovieFilmTransition";

/**
 * One source-shot placement on the finished-film video track.
 *
 * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `IAutoMovieVideoEdit` as the portable data boundary for the agent source result link requirement.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `IAutoMovieVideoEdit` for the spec authoring source derivation state system contract.
 */
export interface IAutoMovieVideoEdit {
  /**
   * Current compiled shot id.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `shot` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `shot` for the spec authoring source derivation state system contract.
   */
  shot: string;

  /**
   * Inclusive source frame.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `sourceIn` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `sourceIn` for the spec authoring source derivation state system contract.
   */
  sourceIn: AutoMovieFilmTime;

  /**
   * Exclusive source frame.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `sourceOut` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `sourceOut` for the spec authoring source derivation state system contract.
   */
  sourceOut: AutoMovieFilmTime;

  /**
   * Film-global inclusive start frame.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `start` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `start` for the spec authoring source derivation state system contract.
   */
  start: AutoMovieFilmTime;

  /**
   * Available transition material at each side of this placement.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `handles` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `handles` for the spec authoring source derivation state system contract.
   */
  handles: {
    /** Available incoming frames. */
    head: AutoMovieFilmTime;

    /** Available outgoing frames. */
    tail: AutoMovieFilmTime;
  };

  /**
   * Transition entering this placement.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `transitionIn` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `transitionIn` for the spec authoring source derivation state system contract.
   */
  transitionIn: IAutoMovieFilmTransition;

  /**
   * Transition leaving this placement.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `transitionOut` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `transitionOut` for the spec authoring source derivation state system contract.
   */
  transitionOut: IAutoMovieFilmTransition;
}
