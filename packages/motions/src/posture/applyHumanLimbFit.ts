import type { IAutoMovieSeededChainFit, IAutoMovieSwivelNear } from "@automovie/engine";
import type { IAutoMoviePose, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanLimbFitMemory } from "./HumanLimbFitMemory";
import type { IHumanPosture } from "./IHumanPosture";
import type { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";

/**
 * Consume native fitting inside one actual constructor-owned COW refit.
 * Same-source misses transfer current-owned/fresh records; cache hits
 * reconstruct the entire exact stored output without reading current joints.
 * Explicit public sources and incoming readers select the independent issuer
 * before this seam; native reader identity alone grants no source ownership.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines actual-new versus independently issued cached data, internal COW ownership and the independent public-result boundary. Member facts: continued: Names current-target correction and its unchanged independent output contract. constructed: States the four-field constructor source and exact ordinary fit result.
 * @evidence contracts/development/implementation.md#principled-implementation An actual closed-scalar miss retaining its identical nonnull nonprivate source root contains fresh writes and the current prefix; private source factories deep-copy/mark their retained roots. Hits materialize every cached exact scalar/order, while rich/private/null/disabled paths clone fully, preserving original duplicates and complete metadata. Member facts: continued: The actual free-curve constructor chooses the existing hinged correction entry, while that curve owns deterministic anchors and postclamp physical admission. constructed: Base-free assembly constructs every clinical record; native fitting preserves its closed schema, so memory can capture exact values directly instead of reflecting it again.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure HumanLimbFitMemory owns actual lookup/capture/issuing; this helper serves only the private constructor/refit route. Independent public refit/pair entrypoints select the original complete issuer, with no caller-provided ownership flag or numerical result. Member facts: continued: Delegates numerical fitting, policy-keyed cache and issuing to the one memory owner. constructed: Delegates the same fitting, capture and issuing responsibilities to the single memory owner.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No cached pose escapes, no caller record is mutated and no untouched joint metadata is recreated from a bone table. The original full key/grid, goal, near seed, actual fit and chosen numerical chain values remain unchanged. Member facts: continued: No caller-provided readiness flag, changed goal, skipped source admission or altered tolerance is accepted. constructed: Targets, keys, near policy, ROM, contacts and numerical admission remain unchanged; rich/base/public input never chooses this entry.
 * @evidence contracts/development/implementation.md#efficient-algorithms A proven native miss needs one output inspection and a constant-size cache packet copy. Hits allocate B exact records without current-input inspection, while unsupported ownership/data paths clone fully. Every actual search remains and speedup is unmeasured. Member facts: continued: One delegation selects the actual cheaper current-target entry and exact scalar capture; total runtime gains are unmeasured. constructed: One delegation selects direct O(B) scalar capture without per-joint descriptor allocations, retaining all actual fit work and unmeasured total gains.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The same-call transfer requires an actual closed-scalar miss with identical nonnull current root absent from the genuine private-factory root set. Hits reconstruct stored values/order beyond the grid without borrowing current or cache joints; no key, target, near or tie policy changes. Member facts: continued: The algorithm policy is included in the key; ordinary public near results retain their existing independent namespace and solving order. constructed: Existing cache and solver owners remain shared; only the actual producer's schema knowledge avoids duplicate work.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Misses transfer current-owned data without retaining it; hits own all reconstructed records/header/seed/value, with only original root restoration borrowed within this operation. No cache/source-factory pose, loan, result history or handle escapes. Member facts: continued: Retains no pose, reader, output or callback; bounded cache/output ownership remains with memory. constructed: The call retains no pose, reader, callback or output; cache ownership and independent issuing stay with HumanLimbFitMemory.
 */
export function applyHumanLimbFit(body: IHumanBody, pose: IAutoMoviePose, limb: IHumanPosture.Limb,
  goal: IHumanPosture.IGoal, placed: readonly ("left" | "right")[], rival?: IAutoMovieVector3,
  near?: IAutoMovieSwivelNear, resolution?: Parameters<typeof prepareHumanPoseResolution>[0]): IAutoMovieSeededChainFit {
  return HumanLimbFitMemory.fitted(body, pose, limb, goal, placed, rival, near, resolution);
}

/**
 * Constructor-known clinical-record capture beside the general owned issuer.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the actual base-free assembly route and its shared solver.
 * @evidence contracts/development/design.md#principled-representation Producer call flow distinguishes known constructed records from general owned records, without a numerical readiness value or public source flag.
 * @evidence contracts/development/design.md#minimal-and-owned-surface constructed serves only the base-free refit's ordinary limb and paired-arm paths.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No arbitrary source registration, cached answer or reader identity is treated as constructed-data provenance.
 */
export namespace applyHumanLimbFit {
  /**
   * Consume a native fit of actual constructor-created clinical records.
   *
   * States the four-field constructor source and exact ordinary fit result.
   * Base-free assembly constructs every clinical record; native fitting preserves its closed schema, so memory can capture exact values directly instead of reflecting it again.
   * Delegates the same fitting, capture and issuing responsibilities to the single memory owner.
   * Targets, keys, near policy, ROM, contacts and numerical admission remain unchanged; rich/base/public input never chooses this entry.
   * One delegation selects direct O(B) scalar capture without per-joint descriptor allocations, retaining all actual fit work and unmeasured total gains.
   * Existing cache and solver owners remain shared; only the actual producer's schema knowledge avoids duplicate work.
   * The call retains no pose, reader, callback or output; cache ownership and independent issuing stay with HumanLimbFitMemory.
   */
  export function constructed(...args: Parameters<typeof applyHumanLimbFit>): ReturnType<typeof applyHumanLimbFit> {
    return HumanLimbFitMemory.constructed(...args);
  }

  /**
   * Consume the actual owned curve's separate current-correction policy.
   *
   * Names current-target correction and its unchanged independent output contract.
   * The actual free-curve constructor chooses the existing hinged correction entry, while that curve owns deterministic anchors and postclamp physical admission.
   * Delegates numerical fitting, policy-keyed cache and issuing to the one memory owner.
   * No caller-provided readiness flag, changed goal, skipped source admission or altered tolerance is accepted.
   * One delegation selects the actual cheaper current-target entry and exact scalar capture; total runtime gains are unmeasured.
   * The algorithm policy is included in the key; ordinary public near results retain their existing independent namespace and solving order.
   * Retains no pose, reader, output or callback; bounded cache/output ownership remains with memory.
   */
  export function continued(...args: Parameters<typeof applyHumanLimbFit>): ReturnType<typeof applyHumanLimbFit> {
    return HumanLimbFitMemory.continued(...args);
  }
}
