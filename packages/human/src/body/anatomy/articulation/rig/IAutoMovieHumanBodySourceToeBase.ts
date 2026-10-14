import type { IAutoMovieHumanBodyBoneWorldRest } from "../../../structures/rig/IAutoMovieHumanBodyBoneWorldRest";
import type { AutoMovieHumanBodyBoneId } from "../../identity/AutoMovieHumanBodyBoneId";
import type { AutoMovieHumanBodySide } from "../../identity/AutoMovieHumanBodySide";
import type { IAutoMovieHumanBodySourcePublicPoseJoint } from "./IAutoMovieHumanBodySourcePublicPoseJoint";

/**
 * One foot's existing aggregate MTP motion frame; it is a goal frame, not an extra anatomical bone or metatarsal carrier.
 *
 * @evidence contracts/common.md#principled-implementation One side's registered MTP goal frame is carried by the actual foot bone and supplies common clinical toe motion before individual rays.
 * @evidence contracts/common.md#clear-and-simple-design A picked subset of public-pose fields reuses existing conversion semantics without treating the aggregate goal as another anatomical bone.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The common MTP frame is a source registration, not a claimed clinical centre or a substitute metatarsal carrier.
 * @evidence contracts/common.md#meaningful-documentation Properties distinguish side ownership, actual foot parent, canonical metre rest frame, excluded ray motion and registration account.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The aggregate toe-base type describes conversion inputs without evaluating the common MTP frame.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Sharing an aggregate goal frame with rays does not create a cross-request toe-motion cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The toe-base registration owns no extra bone instance, retained motion task or skin buffer.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySourceToeBase {
  /** One common definition per anatomical side. */
  side: AutoMovieHumanBodySide;

  /** Actual foot source bone carrying the aggregate MTP rest frame. */
  parent: AutoMovieHumanBodyBoneId;

  /** Registered public toes rest origin/orientation in canonical metres. */
  rest: IAutoMovieHumanBodyBoneWorldRest;

  /** Actual existing left/rightToes clinical conversion; individual ray motion is excluded. */
  goal: Pick<
    IAutoMovieHumanBodySourcePublicPoseJoint,
    "bone" | "axes" | "restFrame" | "supportedAxes"
  >;

  /** Common pivot registration and acquisition/authoring account, without a clinical centre claim. */
  account: string;
}
