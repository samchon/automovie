import type { IAutoMovieHumanConstructionAdmission } from "../../common/structures/IAutoMovieHumanConstructionAdmission";

import type { IConnectedBodyPreviewResult } from "./IConnectedBodyPreviewResult";

/**
 * Construction buffers and the same owner's admission outcome. Inherited preview fields carry available observations, but the construct discriminator preserves draft status even when some checks succeed. The runtime does not place this result in its accepted-build cache.
 *
 * @evidence contracts/common.md#principled-implementation Reusing preview transport fields preserves model and observation representation, while construct plus admission keeps the source owner's refusal separate from accepted preview.
 * @evidence contracts/common.md#clear-and-simple-design Omit replaces only the preview discriminator and adds the owning admission report instead of duplicating transport members.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Inspectable buffers do not promote a refused draft or certify unresolved anatomy; actual owner checks remain attached.
 * @evidence contracts/common.md#meaningful-documentation The prose gives draft status, inherited observation meaning and exclusion from the accepted-build cache.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This construction reply interface executes no buffer packing or admission algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Type inheritance shares a schema rather than a cached runtime result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Buffer ownership and transfer are implemented by the producer and transport, not this erased interface.
 *
 * @author Samchon
 */
export interface IConnectedBodyConstructionResult extends Omit<
  IConnectedBodyPreviewResult,
  "operation"
> {
  /** Distinguishes a draft construction reply from a committed preview. */
  operation: "construct";

  /** Actual existing checks, including each owner's concrete refusal. */
  admission: IAutoMovieHumanConstructionAdmission;
}
