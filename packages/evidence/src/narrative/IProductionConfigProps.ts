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
 *
 * @evidence contracts/common.md#principled-implementation The lifecycle-discriminated object combines route, filesystem root, scope, stage maps, runtime identity and extra claims; stage values select structural checks rather than creative approval.
 * @evidence contracts/common.md#clear-and-simple-design One lifecycle object groups route, package root, scope, stages, runtime identity and extra claims for coherent factory validation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The factory validates route/stage/claim scope coherence; no stage or writer-editable identity grants creative approval.
 * @evidence contracts/common.md#meaningful-documentation Members state absolute package location, support independence, pass ownership and screenplay upstream selection.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Narrative configuration inputs is erased at runtime; producing and consuming functions account for concrete traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Narrative configuration inputs declares data and coordinates no reusable effects; consumers own equivalence and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Narrative configuration inputs acquires no resource or retained state; concrete owners determine instance bytes and lifetimes.
 */
export interface IProductionConfigProps {
  /** Names the evidence lifecycle; it does not issue creative approvals. */
  lifecycle: "independent-evidence-v1";

  /** Chooses four-layer long work, direct short screenplay, compact settings plus screenplay, or standalone assets. */
  mode: "long" | "short" | "short-with-settings" | "asset";

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
   * Sets the screenplay naturalness stage.
   *
   * Revision opens after screenplay construction approval. Scripts answer their
   * expression questions inside construction; settings and treatments also
   * finish within construction.
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
