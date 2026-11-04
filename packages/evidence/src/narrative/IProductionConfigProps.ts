import type { IEvidenceClaim } from "@wrtnlabs/evidence";

import type { IProductionConstruction } from "./IProductionConstruction";
import type { IProductionLayerStages } from "./IProductionLayerStages";
import type { NarrativeScope } from "./NarrativeScope";

/**
 * Selects narrative claim families, their stages and additional native claims.
 *
 * @evidence contracts/common.md#principled-implementation The route, absolute location, authored scope and stage maps select native narrative respondents; extra claims and engineering support remain ordinary native claims.
 * @evidence contracts/common.md#clear-and-simple-design One configuration object groups the options needed by the shared claim collector.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Stages select structural evidence and never certify creative completion; native Evidence evaluates the resulting graph.
 * @evidence contracts/common.md#meaningful-documentation Members explain route, location, scope, stages and additive claims; the production owns independent creative review.
 * @evidence contracts/performance.md#efficient-algorithms This erased interface performs no computation; its collector accounts for discovery and allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work This erased interface owns no cache or coordinated computation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This erased interface acquires no handles or background tasks.
 */
export interface IProductionConfigProps {
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
   * Selects each layer's construction claims and actual parent references.
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

  /**
   * Adds claims used only by this production.
   *
   * They follow the shared claims and do not replace them.
   */
  claims?: IEvidenceClaim[];
}
