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
 * Engine-compiled shot source and retained semantic carriers before builder production materialization.
 *
 * @evidence contracts/common.md#principled-implementation Source compilation lowers the admitted thin program into scene, motions and shot while retaining authored semantic models, environments, simulation bindings and provenance and exact event sample times for later production joins and realization.
 * @evidence contracts/common.md#clear-and-simple-design Separates required engine artifacts and event samples from optional source-owned semantic carriers and compact cue populations, so production can materialize its own inputs without treating source as final dense output.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional compact cues materialize as empty lists when omitted, and source event samples are independently checked against authoritative windows and predicates rather than accepted as realized proof by id alone.
 * @evidence contracts/common.md#meaningful-documentation Defines retained ownership and provenance, structured simulation and planting/service bindings, sampled event timing, derived engine artifacts and optional compact cue omission.
 * @author Samchon
 */
export interface IAutoMovieShotSourceOutput {
  /**
   * Source-owned generated models retained for materialization and evidence.
   */
  authoredModels?: IAutoMovieModel[];

  /** Source-owned production props retained with their semantic contracts. */
  props?: IAutoMoviePropSpec[];

  /** Structured buildings retained for spatial queries and evidence. */
  builtEnvironments?: IAutoMovieBuiltEnvironment[];

  /** Observation documents the building source read, kept as provenance. */
  designReferences?: IAutoMovieDesignReference[];

  /** Citations from authored design members back to those observations. */
  designEvidence?: IAutoMovieDesignEvidence[];

  /** Phase, alternative and change-impact lineage over those identities. */
  designLineages?: IAutoMovieDesignLineage[];

  /** Independent deterministic fluid domains this shot's source declares. */
  fluidDomains?: IAutoMovieFluidDomain[];

  /** Bindings that make those domains a building's own water features. */
  waterFeatures?: IAutoMovieWaterFeature[];

  /** Cloth and cushion domains this shot's source declares. */
  softBodyDomains?: IAutoMovieSoftBodyDomain[];

  /** Bindings that hang those domains on a building's own elements. */
  softFurnishings?: IAutoMovieSoftFurnishing[];

  /** Growth recipes for the planting this shot's source declares. */
  plantingDomains?: IAutoMoviePlantingDomain[];

  /** Arrangements those recipes are grown into. */
  plantingClusters?: IAutoMoviePlantingCluster[];

  /** Bindings that plant those clusters in a building's own spaces. */
  plantingInstallations?: IAutoMoviePlantingInstallation[];

  /** Port networks that serve the buildings this shot stages. */
  serviceNetworks?: IAutoMovieServiceNetwork[];

  /** Event sample times selected inside authoritative event windows. */
  eventSamples: Array<{
    /** Exact event-contract id. */
    id: string;

    /** Shot-local time at which the builder evaluates its predicates. */
    time: number;
  }>;

  /** Scene derived by staging the source-authored program. */
  scene: IAutoMovieScene;

  /** Deterministic motions synthesized and assembled by the engine. */
  motions: IAutoMovieMotion[];

  /**
   * Optional compact formation-level cues. The builder materializes an empty list when omitted; source never emits arbitrary per-member curves.
   */
  formationMotions?: IAutoMovieFormationMotion[];

  /**
   * Optional sparse per-member exceptions inside compact formations. Omission materializes an empty list. Stored data scales with authored cues and slot references; this field does not bound sampling or full-population execution work.
   */
  formationSlotMotions?: IAutoMovieFormationSlotMotion[];

  /** Optional bounded shot-local deterministic effect cues. */
  effectCues?: IAutoMovieShotEffectCue[];

  /** Engine-compiled shot choreography. */
  shot: IAutoMovieShot;
}
