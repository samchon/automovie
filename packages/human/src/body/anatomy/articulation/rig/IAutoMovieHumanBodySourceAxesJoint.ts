import type { IAutoMovieHumanBodyBoneWorldRest } from "../../../structures/rig/IAutoMovieHumanBodyBoneWorldRest";
import type { IAutoMovieHumanBodySourceJointAxis } from "./IAutoMovieHumanBodySourceJointAxis";

/**
 * Ordered intrinsic source coordinates around one shared neutral joint frame.
 *
 * @evidence contracts/common.md#principled-implementation Ordered intrinsic axes share one neutral joint frame so earlier rotations or translations carry subsequent axes as the source defines.
 * @evidence contracts/common.md#clear-and-simple-design The axes discriminator, common frame and ordered axis array expose the complete local joint representation in one record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Explicit registered pivots preserve source motion rather than hiding non-coincident axes in a single assumed ball joint.
 * @evidence contracts/common.md#meaningful-documentation Property comments specify common-body metres, neutral orientation and order-dependent intrinsic coordinate application.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The ordered-axis record describes a sequence but does not multiply its transforms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A shared joint frame is input identity, not a cache of equivalent coordinate evaluations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The axes interface declares caller-owned frame and array references without allocating a transform workspace.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySourceAxesJoint {
  /** Ordered intrinsic source coordinates with explicitly registered local pivots. */
  kind: "axes";

  /** Shared neutral joint centre and orientation in common body metres. */
  frame: IAutoMovieHumanBodyBoneWorldRest;

  /** Source order is significant; each rotation or translation carries later axes. */
  axes: readonly IAutoMovieHumanBodySourceJointAxis[];
}
