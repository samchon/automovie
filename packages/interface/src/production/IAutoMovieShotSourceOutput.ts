import type { IAutoMovieBuiltEnvironment } from "../architecture/IAutoMovieBuiltEnvironment";
import type { IAutoMovieDesignEvidence } from "../architecture/IAutoMovieDesignEvidence";
import type { IAutoMovieDesignLineage } from "../architecture/IAutoMovieDesignLineage";
import type { IAutoMovieDesignReference } from "../architecture/IAutoMovieDesignReference";
import type { IAutoMovieShot } from "../cinematics/IAutoMovieShot";
import type { IAutoMovieFluidDomain } from "../fluid/IAutoMovieFluidDomain";
import type { IAutoMovieWaterFeature } from "../fluid/IAutoMovieWaterFeature";
import type { IAutoMoviePropSpec } from "../harness/IAutoMoviePropSpec";
import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieMotion } from "../motion/IAutoMovieMotion";
import type { IAutoMovieScene } from "../scene/IAutoMovieScene";
import type { IAutoMovieServiceNetwork } from "../service/IAutoMovieServiceNetwork";
import type { IAutoMoviePlantingCluster } from "../soft/IAutoMoviePlantingCluster";
import type { IAutoMoviePlantingDomain } from "../soft/IAutoMoviePlantingDomain";
import type { IAutoMoviePlantingInstallation } from "../soft/IAutoMoviePlantingInstallation";
import type { IAutoMovieSoftBodyDomain } from "../soft/IAutoMovieSoftBodyDomain";
import type { IAutoMovieSoftFurnishing } from "../soft/IAutoMovieSoftFurnishing";
import type { IAutoMovieFormationMotion } from "./IAutoMovieFormationMotion";
import type { IAutoMovieFormationSlotMotion } from "./IAutoMovieFormationSlotMotion";
import type { IAutoMovieShotEffectCue } from "./IAutoMovieShotEffectCue";

/** Engine-compiled shot source with optional host-attached semantic carriers. */
export interface IAutoMovieShotSourceOutput {
  /** Source-owned generated models retained for materialization and evidence. */
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
   * Optional compact formation-level cues. Direct source output can omit them;
   * composing hosts own empty-list normalization and explicit admission.
   */
  formationMotions?: IAutoMovieFormationMotion[];

  /**
   * Optional sparse per-member exceptions inside compact formations. Omission
   * remains undefined until host composition. Stored data scales with authored
   * cues and slot references; this field does not bound sampling or
   * full-population execution work.
   */
  formationSlotMotions?: IAutoMovieFormationSlotMotion[];

  /** Optional bounded shot-local deterministic effect cues. */
  effectCues?: IAutoMovieShotEffectCue[];

  /** Engine-compiled shot choreography. */
  shot: IAutoMovieShot;
}
