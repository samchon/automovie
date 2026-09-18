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
 * Formation and effect cues remain declarative builder inputs; dense actor
 * motion, scene, and shot artifacts are deliberately absent.
 *
 * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `IAutoMovieProductionShotProgram` as the portable data boundary for the formation membership requirement.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `IAutoMovieProductionShotProgram` for the performance formation hierarchy membership command system contract.
 */
export interface IAutoMovieProductionShotProgram extends IAutoMovieShotProgram {
  /**
   * Source-owned generated models assembled by ordinary TypeScript. Imported
   * assets remain builder-owned production inputs rather than sandbox output.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `models` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `models` for the performance formation hierarchy membership command system contract.
   */
  models?: IAutoMovieModel[];
  /**
   * Source-owned semantic props whose model and behavior are validated.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `props` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `props` for the performance formation hierarchy membership command system contract.
   */
  props?: IAutoMoviePropSpec[];
  /**
   * Code-authored buildings used by the shot. They remain structured in the
   * compiled artifact; visible placements and support space are staged from the
   * same record rather than transcribed into a second design.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `builtEnvironments` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `builtEnvironments` for the performance formation hierarchy membership command system contract.
   */
  builtEnvironments?: IAutoMovieBuiltEnvironment[];
  /**
   * Observation documents the building source read, carried as provenance.
   *
   * A reading is never promoted into the design. They are here so the builder
   * can hold each document against the bytes it claims to have observed and
   * refuse a citation whose file has moved on.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `designReferences` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `designReferences` for the performance formation hierarchy membership command system contract.
   */
  designReferences?: IAutoMovieDesignReference[];
  /**
   * Citations from authored design members back to those observations.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `designEvidence` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `designEvidence` for the performance formation hierarchy membership command system contract.
   */
  designEvidence?: IAutoMovieDesignEvidence[];
  /**
   * Phase, alternative and change-impact lineage over those identities.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `designLineages` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `designLineages` for the performance formation hierarchy membership command system contract.
   */
  designLineages?: IAutoMovieDesignLineage[];
  /**
   * Independent deterministic fluid domains this shot's source declares.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `fluidDomains` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `fluidDomains` for the performance formation hierarchy membership command system contract.
   */
  fluidDomains?: IAutoMovieFluidDomain[];
  /**
   * Bindings that make those domains a building's own water features.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `waterFeatures` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `waterFeatures` for the performance formation hierarchy membership command system contract.
   */
  waterFeatures?: IAutoMovieWaterFeature[];
  /**
   * Cloth and cushion domains this shot's source declares.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `softBodyDomains` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `softBodyDomains` for the performance formation hierarchy membership command system contract.
   */
  softBodyDomains?: IAutoMovieSoftBodyDomain[];
  /**
   * Bindings that hang those domains on a building's own elements.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `softFurnishings` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `softFurnishings` for the performance formation hierarchy membership command system contract.
   */
  softFurnishings?: IAutoMovieSoftFurnishing[];
  /**
   * Growth recipes for the planting this shot's source declares.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `plantingDomains` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `plantingDomains` for the performance formation hierarchy membership command system contract.
   */
  plantingDomains?: IAutoMoviePlantingDomain[];
  /**
   * Arrangements those recipes are grown into.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `plantingClusters` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `plantingClusters` for the performance formation hierarchy membership command system contract.
   */
  plantingClusters?: IAutoMoviePlantingCluster[];
  /**
   * Bindings that plant those clusters in a building's own spaces.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `plantingInstallations` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `plantingInstallations` for the performance formation hierarchy membership command system contract.
   */
  plantingInstallations?: IAutoMoviePlantingInstallation[];
  /**
   * Port networks that serve the buildings this shot stages.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `serviceNetworks` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `serviceNetworks` for the performance formation hierarchy membership command system contract.
   */
  serviceNetworks?: IAutoMovieServiceNetwork[];
  /**
   * Optional source-computed clips cited only by explicit `enact` actions.
   *
   * The host still masks, layers, ROM-checks, and assembles these clips through
   * `performShot`; they are not precompiled shot output.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `clips` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `clips` for the performance formation hierarchy membership command system contract.
   */
  clips?: IAutoMovieMotion[];
  /**
   * Optional clips moving this shot's staged lights over its own local clock.
   *
   * The shot-local half of production lighting: a lamp switched on inside this
   * beat, a candle blown out. Each track addresses one staged light by pointer
   * channel (`/lights/<id>/<property>`), the same grammar
   * {@link IAutoMovieProductionLighting.motions} uses on the story clock, and
   * the host carries them onto the compiled shot's `lightMotions`. Omitted, the
   * shot's lighting is constant and its compiled artifact is byte-identical to
   * one compiled before this field existed.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `lightMotions` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `lightMotions` for the performance formation hierarchy membership command system contract.
   */
  lightMotions?: IAutoMovieClip[];
  /**
   * Optional clips turning this shot's non-performing scene nodes over its own
   * local clock, carried onto the compiled shot's `objectMotions`.
   *
   * The moving half of a built world. A building's opening states where its
   * panels stand at each named configuration and a prop states the travel of
   * its own joints, and both were configurations rather than motion: every
   * entry on a compiled shot's `objectMotions` was baked by the engine from a
   * `launch` or an `attachTo`, so nothing a source authored could make a door
   * swing on screen. One channel serves both, because both are one node in the
   * staged graph turned over one clock: a panel is a staged set piece
   * (`<environment>/<element>`, the ids `builtOpeningPanelPlacements` answers
   * with) and a prop's leaf is a lowered articulation joint
   * (`<placement>/<joint>`).
   *
   * The host holds each track to the shot it belongs to: the node must be one
   * this shot staged or a joint a staged prop declares, it must not be a node a
   * performance or a baked clip already drives, its keys must land inside the
   * shot's own clock, and a driven prop joint must stay inside the travel that
   * prop's profile declares. Omitted, the compiled shot carries exactly the
   * clips the engine baked, as it always did.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `objectMotions` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `objectMotions` for the performance formation hierarchy membership command system contract.
   */
  objectMotions?: IAutoMovieClip[];
  /**
   * Optional compact formation-level cues.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `formationMotions` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `formationMotions` for the performance formation hierarchy membership command system contract.
   */
  formationMotions?: IAutoMovieFormationMotion[];
  /**
   * Optional sparse per-member exceptions inside compact formations.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `formationSlotMotions` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `formationSlotMotions` for the performance formation hierarchy membership command system contract.
   */
  formationSlotMotions?: IAutoMovieFormationSlotMotion[];
  /**
   * Optional bounded shot-local deterministic effect cues.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `effectCues` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `effectCues` for the performance formation hierarchy membership command system contract.
   */
  effectCues?: IAutoMovieShotEffectCue[];
}
