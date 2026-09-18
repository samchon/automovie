import { IAutoMovieFormationSlot } from "./IAutoMovieFormationSlot";
import { IAutoMovieInstanceSlot } from "./IAutoMovieInstanceSlot";

/**
 * Deterministic pure helpers exposed to a shot source builder.
 *
 * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `IAutoMovieSourceOracle` as the portable data boundary for the agent source result link requirement.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `IAutoMovieSourceOracle` for the spec authoring source derivation state system contract.
 */
export interface IAutoMovieSourceOracle {
  /**
   * Euclidean distance between two points.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `distance` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `distance` for the spec authoring source derivation state system contract.
   */
  distance(
    left: { x: number; y: number; z: number },
    right: { x: number; y: number; z: number },
  ): number;
  /**
   * Height of the first matching world surface, or zero.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `groundHeight` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `groundHeight` for the spec authoring source derivation state system contract.
   */
  groundHeight(point: { x: number; z: number }): number;
  /**
   * Regenerate one exact builder-owned formation slot without expanding it.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `formationSlot` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `formationSlot` for the spec authoring source derivation state system contract.
   */
  formationSlot(formation: string, slot: number): IAutoMovieFormationSlot;
  /**
   * Regenerate one exact builder-owned general instance without expanding it.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `instanceSlot` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `instanceSlot` for the spec authoring source derivation state system contract.
   */
  instanceSlot(instanceSet: string, slot: number): IAutoMovieInstanceSlot;
}
