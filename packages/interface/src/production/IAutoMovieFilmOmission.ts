/**
 * Explicit narrative-shot omission disposition.
 *
 * @evidence requirements/agent-authoring/partial-work.md#agent-declared-omission Exposes `IAutoMovieFilmOmission` as the portable data boundary for the agent declared omission requirement.
 * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-omission-failure Types `IAutoMovieFilmOmission` for the spec authoring partial omission failure system contract.
 */
export interface IAutoMovieFilmOmission {
  /**
   * Current shot contract intentionally absent from the edit.
   *
   * @evidence requirements/agent-authoring/partial-work.md#agent-declared-omission Exposes `shot` as the portable data boundary for the agent declared omission requirement.
   * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-omission-failure Types `shot` for the spec authoring partial omission failure system contract.
   */
  shot: string;
  /**
   * Auditable non-blank reason.
   *
   * @evidence requirements/agent-authoring/partial-work.md#agent-declared-omission Exposes `reason` as the portable data boundary for the agent declared omission requirement.
   * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-omission-failure Types `reason` for the spec authoring partial omission failure system contract.
   */
  reason: string;
}
