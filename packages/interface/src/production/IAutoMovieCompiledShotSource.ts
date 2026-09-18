import { IAutoMovieModel } from "../model/IAutoMovieModel";
import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { IAutoMovieCompiledEffect } from "./IAutoMovieCompiledEffect";
import { IAutoMovieCompiledFormation } from "./IAutoMovieCompiledFormation";
import { IAutoMovieCompiledInstanceSet } from "./IAutoMovieCompiledInstanceSet";
import { IAutoMovieFormationMotion } from "./IAutoMovieFormationMotion";
import { IAutoMovieFormationSlotMotion } from "./IAutoMovieFormationSlotMotion";
import { IAutoMovieShotSourceOutput } from "./IAutoMovieShotSourceOutput";

/**
 * Fully builder-owned shot artifact consumed by render and oracle services.
 *
 * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `IAutoMovieCompiledShotSource` as the portable data boundary for the agent source result link requirement.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `IAutoMovieCompiledShotSource` for the spec authoring source derivation state system contract.
 */
export interface IAutoMovieCompiledShotSource extends IAutoMovieShotSourceOutput {
  /**
   * Exact graph-selected source export and authored unit carried into the
   * materialized shot. Omitted only for legacy source-scope callers that did
   * not supply authoring evidence; review and final never publish without it.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Keeps the executed source revision and exact authored target together in the compiled result.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-derivation-output-lineage Carries the resolved runtime and target identity into the derived shot artifact.
   */
  sourceOwner?: {
    branch: string;
    path: string;
    export: string;
    digest: AutoMovieContentDigest;
    target: string;
  };

  /**
   * Reviewed non-entry exports bound to the same unit, retained as acceptance
   * attribution without executing them as shot builders.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Keeps reviewed acceptance attribution separate from the executed runtime source.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-derivation-output-lineage Carries non-entry reviewed edges without promoting them to runtime ownership.
   */
  acceptanceSources?: Array<{
    path: string;
    export: string;
    digest: AutoMovieContentDigest;
    target: string;
  }>;

  /**
   * Models required by this shot.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `models` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `models` for the spec authoring source derivation state system contract.
   */
  models: IAutoMovieModel[];

  /**
   * Compact formation runtimes required by this shot.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `formations` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `formations` for the spec authoring source derivation state system contract.
   */
  formations: IAutoMovieCompiledFormation[];

  /**
   * Compact general instance runtimes placed by the production world.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `instanceSets` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `instanceSets` for the spec authoring source derivation state system contract.
   */
  instanceSets: IAutoMovieCompiledInstanceSet[];

  /**
   * Validated compact formation-level cues, empty when source omitted them.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `formationMotions` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `formationMotions` for the spec authoring source derivation state system contract.
   */
  formationMotions: IAutoMovieFormationMotion[];

  /**
   * Validated sparse per-member exceptions, empty when source omitted them.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `formationSlotMotions` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `formationSlotMotions` for the spec authoring source derivation state system contract.
   */
  formationSlotMotions: IAutoMovieFormationSlotMotion[];

  /**
   * Compiler-owned deterministic effect runtimes.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `effects` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `effects` for the spec authoring source derivation state system contract.
   */
  effects: IAutoMovieCompiledEffect[];
}
