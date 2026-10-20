import type { IAutoMovieSkeleton } from "@automovie/interface";

import type { IAutoMovieExternalMotionBoneMapping } from "./IAutoMovieExternalMotionBoneMapping";

/**
 * Validated inputs a native adoption hands to the motion builder, which still decides whether the take's interpolation and channel coverage can become clinical motion.
 *
 * @evidence contracts/common.md#principled-implementation The handoff carries a rig whose mapped bones matched the inspected basis and a node-sorted mapping, a canonical order that makes two receipts for the same decision compare equal regardless of the author's row order.
 * @evidence contracts/common.md#clear-and-simple-design A separate handoff type keeps the builder's input apart from the author's decision, so the builder never sees the unvalidated take id field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The handoff states that interpolation and channel coverage remain the builder's decision instead of claiming ingest proved the take convertible.
 * @evidence contracts/common.md#meaningful-documentation The comments state that the rig is a deep copy and that the mapping is sorted by node id in code-unit order.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface only shapes adoption output; its construction cost is counted on adoption.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No work is performed by the type itself.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The handoff holds copies owned by the receipt; it shares no storage with the decision.
 */
export interface IAutoMovieExternalMotionNativeHandoff {
  /** Mode discriminator. */
  mode: "native";

  /** Deep copy of the decision's source rig, sharing nothing with it. */
  sourceRig: IAutoMovieSkeleton;

  /** Copy of the decision's mapping sorted by node id in code-unit order. */
  mapping: IAutoMovieExternalMotionBoneMapping[];
}
