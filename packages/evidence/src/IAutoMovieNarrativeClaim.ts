import type { IEvidenceClaim } from "@wrtnlabs/evidence";

import type { AuthoredLayer } from "./narrative/AuthoredLayer";
import type { ProductionGatePass } from "./narrative/ProductionGatePass";

/**
 * Keeps one named work claim beside its exact narrative owner.
 *
 * @evidence contracts/common.md#principled-implementation The record binds a native claim with a required name to the layer and pass that consume it; the factory derives matching ownership records from this same record.
 * @evidence contracts/common.md#clear-and-simple-design One record replaces two independently edited claim and gate-name arrays.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The native claim remains unchanged; no fixture name or consumer exception determines its owner.
 * @evidence contracts/common.md#meaningful-documentation Fields explain claim naming and responsibility boundaries; native Evidence types own selector syntax.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural type chooses no algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This structural type coordinates no work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This structural type owns no handles or retained tasks.
 */
export interface IAutoMovieNarrativeClaim {
  /** Layer whose current pass must establish this requirement. */
  layer: AuthoredLayer;

  /** Construction or expression revision owns the requirement independently. */
  pass: ProductionGatePass;

  /** Native Evidence claim; its name must be unique within this configuration. */
  claim: IEvidenceClaim & { name: string };
}
