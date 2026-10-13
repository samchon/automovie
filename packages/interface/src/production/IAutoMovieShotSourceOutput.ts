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

/** Engine-compiled shot source before production materialization is added. */
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
   * Optional compact formation-level cues. The builder materializes an empty
   * list when omitted; source never emits arbitrary per-member curves.
   */
  formationMotions?: IAutoMovieFormationMotion[];

  /**
   * Optional sparse per-member exceptions inside compact formations. The
   * builder materializes an empty list when omitted; the cost is the number of
   * exceptions, never the number of members.
   */
  formationSlotMotions?: IAutoMovieFormationSlotMotion[];

  /** Optional bounded shot-local deterministic effect cues. */
  effectCues?: IAutoMovieShotEffectCue[];

  /** Engine-compiled shot choreography. */
  shot: IAutoMovieShot;
}
