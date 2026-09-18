/**
 * Host-compilable runtime facts for one actor in a thin shot program.
 *
 * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Exposes `IAutoMovieShotActorProgram` as the portable data boundary for the agent runtime authority requirement.
 * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Types `IAutoMovieShotActorProgram` for the spec authoring runtime evidence authority invariant system contract.
 */
export interface IAutoMovieShotActorProgram {
  /**
   * Staged actor node whose actions these facts support.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Exposes `node` as the portable data boundary for the agent runtime authority requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Types `node` for the spec authoring runtime evidence authority invariant system contract.
   */
  node: string;
  /**
   * Compiler-owned runtime model id providing the skeleton and gait profiles.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Exposes `model` as the portable data boundary for the agent runtime authority requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Types `model` for the spec authoring runtime evidence authority invariant system contract.
   */
  model: string;
  /**
   * Finite positive locomotion speed in world meters per second.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Exposes `speed` as the portable data boundary for the agent runtime authority requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Types `speed` for the spec authoring runtime evidence authority invariant system contract.
   */
  speed: number;
  /**
   * Finite non-negative eye height above the staged root, in meters.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Exposes `eyeHeight` as the portable data boundary for the agent runtime authority requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Types `eyeHeight` for the spec authoring runtime evidence authority invariant system contract.
   */
  eyeHeight: number;
}
