import type { IEvidenceClaim } from "@wrtnlabs/evidence";

import type { IProductionConstruction } from "./IProductionConstruction";
import type { IProductionLayerStages } from "./IProductionLayerStages";
import type { NarrativeScope } from "./NarrativeScope";
import type { IProductionGatePolicy } from "./ProductionGate";

/**
 * Sets up one production's evidence config.
 *
 * Give the package location, each pass's stage per layer, the gate policy, and
 * any claims used only by this production. Stages enable structural evidence; an independent reader
 * decides creative completion after the reported prerequisites are ready.
 */
export interface IProductionConfigProps {
  /** Names the evidence lifecycle; it does not issue creative approvals. */
  lifecycle: "independent-evidence-v1";

  /** Chooses the long narrative, direct screenplay, or standalone asset route. */
  mode: "long" | "short" | "asset";

  /** Engineering duties participate globally without a narrative parent. */
  supportClaims?: IEvidenceClaim[];

  /**
   * Points to the production package.
   *
   * Use its absolute directory so package and shared files resolve correctly.
   */
  location: string;

  /** Selects the complete work or one exact first-part pilot slice. */
  narrativeScope: NarrativeScope;

  /**
   * Sets each layer's construction stage and upstream approval dependency.
   *
   * It owns what the layer says: the principles each unit answers for itself
   * and the population duties the layer's own material settles.
   */
  construction: IProductionConstruction;

  /**
   * Sets scripts and screenplay naturalness stages.
   *
   * Each revision opens after its construction approval. Screenplay normally uses
   * approved scripts naturalness; `[stage, false]` explicitly uses scripts
   * construction. Settings and treatments have no separate expression pass.
   */
  naturalness: IProductionLayerStages;

  /** Versions the gate runtime and assigns every work claim to one layer and pass. */
  gate: IProductionGatePolicy;

  /**
   * Adds claims used only by this production.
   *
   * They follow the shared claims and do not replace them.
   */
  claims?: IEvidenceClaim[];
}
