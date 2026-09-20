/**
 * One source-authored shot-local effect activation.
 *
 * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `IAutoMovieShotEffectCue` as the portable data boundary for the agent source result link requirement.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `IAutoMovieShotEffectCue` for the spec authoring source derivation state system contract.
 */
export interface IAutoMovieShotEffectCue {
  /**
   * Stable cue id, unique inside one shot.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `id` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `id` for the spec authoring source derivation state system contract.
   */
  id: string;

  /**
   * Existing world effect-zone id.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `zone` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `zone` for the spec authoring source derivation state system contract.
   */
  zone: string;

  /**
   * Inclusive shot-local start in seconds.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `start` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `start` for the spec authoring source derivation state system contract.
   */
  start: number;

  /**
   * Exclusive shot-local end in seconds.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `end` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `end` for the spec authoring source derivation state system contract.
   */
  end: number;

  /**
   * Bounded intensity envelope.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `intensity` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `intensity` for the spec authoring source derivation state system contract.
   */
  intensity: {
    /** Intensity at cue start. */
    from: number;

    /** Intensity at cue end. */
    to: number;
  };

  /**
   * Optional authoritative shot event that must realize inside this cue.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `event` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `event` for the spec authoring source derivation state system contract.
   */
  event?: string;
}
