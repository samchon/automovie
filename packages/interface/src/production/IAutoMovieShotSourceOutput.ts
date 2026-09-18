import { IAutoMovieBuiltEnvironment } from "../architecture/IAutoMovieBuiltEnvironment";
import { IAutoMovieDesignEvidence } from "../architecture/IAutoMovieDesignEvidence";
import { IAutoMovieDesignLineage } from "../architecture/IAutoMovieDesignLineage";
import { IAutoMovieDesignReference } from "../architecture/IAutoMovieDesignReference";
import { IAutoMovieShot } from "../cinematics/IAutoMovieShot";
import { IAutoMovieFluidDomain } from "../fluid/IAutoMovieFluidDomain";
import { IAutoMovieWaterFeature } from "../fluid/IAutoMovieWaterFeature";
import { IAutoMoviePropSpec } from "../harness/IAutoMoviePropSpec";
import { IAutoMovieModel } from "../model/IAutoMovieModel";
import { IAutoMovieMotion } from "../motion/IAutoMovieMotion";
import { IAutoMovieScene } from "../scene/IAutoMovieScene";
import { IAutoMovieServiceNetwork } from "../service/IAutoMovieServiceNetwork";
import { IAutoMoviePlantingCluster } from "../soft/IAutoMoviePlantingCluster";
import { IAutoMoviePlantingDomain } from "../soft/IAutoMoviePlantingDomain";
import { IAutoMoviePlantingInstallation } from "../soft/IAutoMoviePlantingInstallation";
import { IAutoMovieSoftBodyDomain } from "../soft/IAutoMovieSoftBodyDomain";
import { IAutoMovieSoftFurnishing } from "../soft/IAutoMovieSoftFurnishing";
import { IAutoMovieFormationMotion } from "./IAutoMovieFormationMotion";
import { IAutoMovieFormationSlotMotion } from "./IAutoMovieFormationSlotMotion";
import { IAutoMovieShotEffectCue } from "./IAutoMovieShotEffectCue";

/**
 * Engine-compiled shot source before production materialization is added.
 *
 * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `IAutoMovieShotSourceOutput` as the portable data boundary for the agent source result link requirement.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `IAutoMovieShotSourceOutput` for the spec authoring source derivation state system contract.
 */
export interface IAutoMovieShotSourceOutput {
  /**
   * Source-owned generated models retained for materialization and evidence.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `authoredModels` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `authoredModels` for the spec authoring source derivation state system contract.
   */
  authoredModels?: IAutoMovieModel[];
  /**
   * Source-owned production props retained with their semantic contracts.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `props` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `props` for the spec authoring source derivation state system contract.
   */
  props?: IAutoMoviePropSpec[];
  /**
   * Structured buildings retained for spatial queries and evidence.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `builtEnvironments` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `builtEnvironments` for the spec authoring source derivation state system contract.
   */
  builtEnvironments?: IAutoMovieBuiltEnvironment[];
  /**
   * Observation documents the building source read, kept as provenance.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `designReferences` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `designReferences` for the spec authoring source derivation state system contract.
   */
  designReferences?: IAutoMovieDesignReference[];
  /**
   * Citations from authored design members back to those observations.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `designEvidence` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `designEvidence` for the spec authoring source derivation state system contract.
   */
  designEvidence?: IAutoMovieDesignEvidence[];
  /**
   * Phase, alternative and change-impact lineage over those identities.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `designLineages` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `designLineages` for the spec authoring source derivation state system contract.
   */
  designLineages?: IAutoMovieDesignLineage[];
  /**
   * Independent deterministic fluid domains this shot's source declares.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `fluidDomains` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `fluidDomains` for the spec authoring source derivation state system contract.
   */
  fluidDomains?: IAutoMovieFluidDomain[];
  /**
   * Bindings that make those domains a building's own water features.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `waterFeatures` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `waterFeatures` for the spec authoring source derivation state system contract.
   */
  waterFeatures?: IAutoMovieWaterFeature[];
  /**
   * Cloth and cushion domains this shot's source declares.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `softBodyDomains` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `softBodyDomains` for the spec authoring source derivation state system contract.
   */
  softBodyDomains?: IAutoMovieSoftBodyDomain[];
  /**
   * Bindings that hang those domains on a building's own elements.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `softFurnishings` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `softFurnishings` for the spec authoring source derivation state system contract.
   */
  softFurnishings?: IAutoMovieSoftFurnishing[];
  /**
   * Growth recipes for the planting this shot's source declares.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `plantingDomains` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `plantingDomains` for the spec authoring source derivation state system contract.
   */
  plantingDomains?: IAutoMoviePlantingDomain[];
  /**
   * Arrangements those recipes are grown into.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `plantingClusters` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `plantingClusters` for the spec authoring source derivation state system contract.
   */
  plantingClusters?: IAutoMoviePlantingCluster[];
  /**
   * Bindings that plant those clusters in a building's own spaces.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `plantingInstallations` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `plantingInstallations` for the spec authoring source derivation state system contract.
   */
  plantingInstallations?: IAutoMoviePlantingInstallation[];
  /**
   * Port networks that serve the buildings this shot stages.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `serviceNetworks` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `serviceNetworks` for the spec authoring source derivation state system contract.
   */
  serviceNetworks?: IAutoMovieServiceNetwork[];
  /**
   * Event sample times selected inside authoritative event windows.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `eventSamples` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `eventSamples` for the spec authoring source derivation state system contract.
   */
  eventSamples: Array<{
    /** Exact event-contract id. */
    id: string;
    /** Shot-local time at which the builder evaluates its predicates. */
    time: number;
  }>;
  /**
   * Scene derived by staging the source-authored program.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `scene` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `scene` for the spec authoring source derivation state system contract.
   */
  scene: IAutoMovieScene;
  /**
   * Deterministic motions synthesized and assembled by the engine.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `motions` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `motions` for the spec authoring source derivation state system contract.
   */
  motions: IAutoMovieMotion[];
  /**
   * Optional compact formation-level cues. The builder materializes an empty
   * list when omitted; source never emits arbitrary per-member curves.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `formationMotions` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `formationMotions` for the spec authoring source derivation state system contract.
   */
  formationMotions?: IAutoMovieFormationMotion[];
  /**
   * Optional sparse per-member exceptions inside compact formations. The
   * builder materializes an empty list when omitted; the cost is the number of
   * exceptions, never the number of members.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `formationSlotMotions` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `formationSlotMotions` for the spec authoring source derivation state system contract.
   */
  formationSlotMotions?: IAutoMovieFormationSlotMotion[];
  /**
   * Optional bounded shot-local deterministic effect cues.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `effectCues` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `effectCues` for the spec authoring source derivation state system contract.
   */
  effectCues?: IAutoMovieShotEffectCue[];
  /**
   * Engine-compiled shot choreography.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Exposes `shot` as the portable data boundary for the agent source result link requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-derivation-state Types `shot` for the spec authoring source derivation state system contract.
   */
  shot: IAutoMovieShot;
}
