import type { IAutoMovieHumanBodyBoneWorldRest } from "../../../structures/rig/IAutoMovieHumanBodyBoneWorldRest";
import type { AutoMovieHumanBodySide } from "../../identity/AutoMovieHumanBodySide";
import type { IAutoMovieHumanBodySourceJointAxis } from "./IAutoMovieHumanBodySourceJointAxis";

/**
 * A proximal source phalanx composes its ray motion on the foot's shared aggregate MTP frame in one graph evaluation.
 *
 * @evidence contracts/common.md#principled-implementation A proximal phalanx composes relative ray axes on one foot's shared aggregate MTP frame, preserving splay-before-flexion order in the same graph.
 * @evidence contracts/common.md#clear-and-simple-design The toe-ray variant exposes base side, local joint frame and relative axes while ordinary axes own distal-phalanx articulation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The shared aggregate goal is not duplicated as another anatomical bone or independently reconstructed ray carrier.
 * @evidence contracts/common.md#meaningful-documentation Fields identify proximal-versus-distal ownership, the per-foot base registration, local pivot and relative-axis composition order.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The proximal-ray type defines composition dependencies without multiplying transform matrices.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A shared per-foot base reference does not itself retain completed ray-motion results.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The ray-joint interface acquires no metatarsal object or per-frame numerical storage.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySourceToeRayJoint {
  /** Intermediate/distal phalanges use ordinary source axes and their actual preceding phalanx parent. */
  kind: "toe-ray";

  /** Actual common MTP goal frame for this foot, defined once in rig.toeBases. */
  base: AutoMovieHumanBodySide;

  /** This source phalanx's actual source-defined local joint pivot/frame. */
  frame: IAutoMovieHumanBodyBoneWorldRest;

  /** Relative per-ray axes after the common base; order preserves the existing splay-before-flexion composition. */
  axes: readonly IAutoMovieHumanBodySourceJointAxis[];
}
