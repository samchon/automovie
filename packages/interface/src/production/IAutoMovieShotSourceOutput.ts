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

/**
 * Engine-compiled shot source with optional host-attached semantic carriers.
 *
 * @evidence contracts/development/design.md#principled-representation compileDefinedShot returns scene, motions and shot from its stage/performance pipeline and deep-copies authored event samples before realizeShotContract checks their windows and predicates. Optional semantic carriers are host-attached inputs to Engine queries and render adapters; that direct compiler does not automatically preserve or validate every optional field.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Separates required engine artifacts and event samples from optional semantic carriers and compact cues, allowing explicit host composition without expanding the direct defineShot compiler into a production orchestrator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Source event samples are independently checked by realizeShotContract rather than accepted as proof by id alone. Optional cue omission remains undefined in direct source output; a host composing IAutoMovieCompiledShotSource must provide its required cue arrays and run the relevant validators explicitly.
 * @evidence contracts/development/common.md#meaningful-documentation Defines retained ownership and provenance, structured simulation and planting/service bindings, sampled event timing, derived engine artifacts and optional compact cue omission.
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
   * Optional compact formation-level cues. Direct source output can omit them; composing hosts own empty-list normalization and explicit admission.
   */
  formationMotions?: IAutoMovieFormationMotion[];

  /**
   * Optional sparse per-member exceptions inside compact formations. Omission remains undefined until host composition. Stored data scales with authored cues and slot references; this field does not bound sampling or full-population execution work.
   */
  formationSlotMotions?: IAutoMovieFormationSlotMotion[];

  /** Optional bounded shot-local deterministic effect cues. */
  effectCues?: IAutoMovieShotEffectCue[];

  /** Engine-compiled shot choreography. */
  shot: IAutoMovieShot;
}
