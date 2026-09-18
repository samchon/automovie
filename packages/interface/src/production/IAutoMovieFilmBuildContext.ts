import type { IAutoMovieDerivedArtifactSource } from "./IAutoMovieDerivedArtifactSource";
import { IAutoMovieProductionDesign } from "./IAutoMovieProductionDesign";
import { IAutoMovieShotContract } from "./IAutoMovieShotContract";
import { IAutoMovieWorldDesign } from "./IAutoMovieWorldDesign";

/**
 * Frozen design and ownership facts available to the film source builder.
 *
 * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `IAutoMovieFilmBuildContext` as the portable data boundary for the agent source result link requirement.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `IAutoMovieFilmBuildContext` for the spec authoring source derivation state system contract.
 */
export interface IAutoMovieFilmBuildContext {
  /**
   * Current production design.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `production` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `production` for the spec authoring source derivation state system contract.
   */
  production: IAutoMovieProductionDesign;

  /**
   * Current shot contracts keyed by id.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `shots` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `shots` for the spec authoring source derivation state system contract.
   */
  shots: Readonly<Record<string, IAutoMovieShotContract>>;

  /**
   * Declared, present render-content paths.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `assets` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `assets` for the spec authoring source derivation state system contract.
   */
  assets: readonly string[];

  /**
   * Current verified deterministic artifacts keyed by canonical output path.
   *
   * @evidence requirements/agent-authoring/deterministic-precomputation.md#agent-precomputed-compile-refusal Publishes only artifacts whose live basis and output passed the pre-execution gate.
   * @evidence specifications/authoring-and-authority/deterministic-precomputed-artifacts.md#spec-authoring-precomputed-freshness Carries verified text or base64 bytes through the JSON source boundary.
   */
  derivedArtifacts: Readonly<Record<string, IAutoMovieDerivedArtifactSource>>;

  /**
   * Current registered deterministic effect zones.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `effectZones` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `effectZones` for the spec authoring source derivation state system contract.
   */
  effectZones: Readonly<IAutoMovieWorldDesign["effectZones"]>;
}
