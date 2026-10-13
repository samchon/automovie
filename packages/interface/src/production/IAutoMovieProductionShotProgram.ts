import { IAutoMovieBuiltEnvironment } from "../architecture/IAutoMovieBuiltEnvironment";
import { IAutoMovieDesignEvidence } from "../architecture/IAutoMovieDesignEvidence";
import { IAutoMovieDesignLineage } from "../architecture/IAutoMovieDesignLineage";
import { IAutoMovieDesignReference } from "../architecture/IAutoMovieDesignReference";
import { IAutoMovieShotProgram } from "../authoring/IAutoMovieShotProgram";
import { IAutoMovieClip } from "../core/IAutoMovieClip";
import { IAutoMovieFluidDomain } from "../fluid/IAutoMovieFluidDomain";
import { IAutoMovieWaterFeature } from "../fluid/IAutoMovieWaterFeature";
import { IAutoMoviePropSpec } from "../harness/IAutoMoviePropSpec";
import { IAutoMovieModel } from "../model/IAutoMovieModel";
import { IAutoMovieMotion } from "../motion/IAutoMovieMotion";
import { IAutoMovieProductionLighting } from "../scene/IAutoMovieProductionLighting";
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
 * Thin engine program plus production-only compact cues.
 *
 * Formation and effect cues remain declarative builder inputs; the host validates source-owned semantic objects and channels before producing dense compiled scene and shot artifacts.
 *
 * @evidence contracts/common.md#principled-implementation Extends the engine shot program with source-owned models, environments, simulations, provenance and compact cues; production joins them with admitted builder inputs and delegates performance, ROM and channel validation to the engine before compilation.
 * @evidence contracts/common.md#clear-and-simple-design Optional production carriers stay beside the underlying engine program, while generated scene/shot artifacts remain outputs and shared production lighting stays on its story-clock owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Imported appearances remain builder-owned, clips require explicit enact actions, object channels may not compete with performing or baked tracks, and omitted channels preserve the existing compiled paths.
 * @evidence contracts/common.md#meaningful-documentation Defines each source-owned carrier, provenance role, simulation binding, shot-local channel ownership and admission constraints, and compact formation and effect cues.
 * @author Samchon
 */
export interface IAutoMovieProductionShotProgram extends IAutoMovieShotProgram {
  /**
   * Source-owned generated models assembled by ordinary TypeScript. Imported assets remain builder-owned production inputs rather than sandbox output.
   */
  models?: IAutoMovieModel[];

  /** Source-owned semantic props whose model and behavior are validated. */
  props?: IAutoMoviePropSpec[];

  /**
   * Code-authored buildings used by the shot. They remain structured in the compiled artifact; visible placements and support space are staged from the same record rather than transcribed into a second design.
   */
  builtEnvironments?: IAutoMovieBuiltEnvironment[];

  /**
   * Observation documents the building source read, carried as provenance.
   *
   * A reading is never promoted into the design. They are here so the builder can hold each document against the bytes it claims to have observed and refuse a citation whose file has moved on.
   */
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

  /**
   * Optional source-computed clips cited only by explicit `enact` actions.
   *
   * The host still masks, layers, ROM-checks, and assembles these clips through `performShot`; they are not precompiled shot output.
   */
  clips?: IAutoMovieMotion[];

  /**
   * Optional clips moving this shot's staged lights over its own local clock.
   *
   * The shot-local half of production lighting: a lamp switched on inside this beat, a candle blown out. Each track addresses one staged light by pointer channel (`/lights/<id>/<property>`), the same grammar {@link IAutoMovieProductionLighting.motions} uses on the story clock, and the host carries them onto the compiled shot's `lightMotions`. Omitted, the shot's lighting is constant and its compiled artifact is byte-identical to one compiled before this field existed.
   */
  lightMotions?: IAutoMovieClip[];

  /**
   * Optional clips turning this shot's non-performing scene nodes over its own local clock, carried onto the compiled shot's `objectMotions`.
   *
   * The moving half of a built world. A building's opening states where its panels stand at each named configuration and a prop states the travel of its own joints, and both were configurations rather than motion: every entry on a compiled shot's `objectMotions` was baked by the engine from a `launch` or an `attachTo`, so nothing a source authored could make a door swing on screen. One channel serves both, because both are one node in the staged graph turned over one clock: a panel is a staged set piece (`<environment>/<element>`, the ids `builtOpeningPanelPlacements` answers with) and a prop's leaf is a lowered articulation joint (`<placement>/<joint>`).
   *
   * The host holds each track to the shot it belongs to: the node must be one this shot staged or a joint a staged prop declares, it must not be a node a performance or a baked clip already drives, its keys must land inside the shot's own clock, and a driven prop joint must stay inside the travel that prop's profile declares. Omitted, the compiled shot carries exactly the clips the engine baked, as it always did.
   */
  objectMotions?: IAutoMovieClip[];

  /** Optional compact formation-level cues. */
  formationMotions?: IAutoMovieFormationMotion[];

  /** Optional sparse per-member exceptions inside compact formations. */
  formationSlotMotions?: IAutoMovieFormationSlotMotion[];

  /** Optional bounded shot-local deterministic effect cues. */
  effectCues?: IAutoMovieShotEffectCue[];
}
