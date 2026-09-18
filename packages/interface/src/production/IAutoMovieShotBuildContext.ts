import { IAutoMovieModel } from "../model/IAutoMovieModel";
import { IAutoMovieProductionLighting } from "../scene/IAutoMovieProductionLighting";
import type { IAutoMovieDerivedArtifactSource } from "./IAutoMovieDerivedArtifactSource";
import { IAutoMovieFormationDesign } from "./IAutoMovieFormationDesign";
import { IAutoMovieModelRecipe } from "./IAutoMovieModelRecipe";
import { IAutoMovieShotContract } from "./IAutoMovieShotContract";
import { IAutoMovieWorldDesign } from "./IAutoMovieWorldDesign";
import { IAutoMovieCompiledFormation } from "./IAutoMovieCompiledFormation";
import { IAutoMovieCompiledInstanceSet } from "./IAutoMovieCompiledInstanceSet";
import { IAutoMovieSourceOracle } from "./IAutoMovieSourceOracle";

/**
 * Frozen input available to a coding-agent-owned shot source builder.
 *
 * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `IAutoMovieShotBuildContext` as the portable data boundary for the agent source result link requirement.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `IAutoMovieShotBuildContext` for the spec authoring source derivation state system contract.
 */
export interface IAutoMovieShotBuildContext {
  /**
   * Current shot contract.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `contract` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `contract` for the spec authoring source derivation state system contract.
   */
  contract: IAutoMovieShotContract;
  /**
   * Current model recipes keyed by id.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `models` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `models` for the spec authoring source derivation state system contract.
   */
  models: Readonly<Record<string, IAutoMovieModelRecipe>>;
  /**
   * Current verified deterministic artifacts keyed by canonical output path.
   *
   * @evidence requirements/agent-authoring/deterministic-precomputation.md#agent-precomputed-compile-refusal Publishes only artifacts whose live basis and output passed the pre-execution gate.
   * @evidence specifications/authoring-and-authority/deterministic-precomputed-artifacts.md#spec-authoring-precomputed-freshness Carries verified text or base64 bytes through the JSON source boundary.
   */
  derivedArtifacts: Readonly<Record<string, IAutoMovieDerivedArtifactSource>>;
  /**
   * The production's story-clock light sources, when it declares any.
   *
   * The source reads what the production is lit by at this shot's story moment
   * — its contract carries the pin — and states its own local light on top
   * through {@link IAutoMovieProductionShotProgram.lightMotions}. Absent when
   * the production declares no lighting, which is exactly the context a source
   * saw before the field existed.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `lighting` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `lighting` for the spec authoring source derivation state system contract.
   */
  lighting?: IAutoMovieProductionLighting;
  /**
   * Current world design.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `world` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `world` for the spec authoring source derivation state system contract.
   */
  world: IAutoMovieWorldDesign;
  /**
   * Current formations keyed by id.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `formations` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `formations` for the spec authoring source derivation state system contract.
   */
  formations: Readonly<Record<string, IAutoMovieFormationDesign>>;
  /**
   * Compiler-generated primitive runtime models keyed by recipe id.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `runtimeModels` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `runtimeModels` for the spec authoring source derivation state system contract.
   */
  runtimeModels: Readonly<Record<string, IAutoMovieModel>>;
  /**
   * Compact builder-derived formation runtimes keyed by formation id.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `formationRuntime` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `formationRuntime` for the spec authoring source derivation state system contract.
   */
  formationRuntime: Readonly<Record<string, IAutoMovieCompiledFormation>>;
  /**
   * Compact builder-derived general instance runtimes keyed by set id.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `instanceSetRuntime` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `instanceSetRuntime` for the spec authoring source derivation state system contract.
   */
  instanceSetRuntime: Readonly<Record<string, IAutoMovieCompiledInstanceSet>>;
  /**
   * Deterministic geometry helpers.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `engine` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `engine` for the spec authoring source derivation state system contract.
   */
  engine: IAutoMovieSourceOracle;
}
