import type { IAutoMovieHumanBodyShoulderPose } from "../../../structures/IAutoMovieHumanBodyShoulderPose";
import type { IAutoMovieHumanBodyBoneWorldRest } from "../../../structures/rig/IAutoMovieHumanBodyBoneWorldRest";
import type { IAutoMovieHumanBodyShoulderContract } from "../../../structures/rig/IAutoMovieHumanBodyShoulderContract";
import type { AutoMovieHumanBodyBoneId } from "../../identity/AutoMovieHumanBodyBoneId";
import type { IAutoMovieHumanBodySourceJointAxis } from "./IAutoMovieHumanBodySourceJointAxis";

/**
 * Whole TT arm goal solved after the source girdle carries the GH centre.
 *
 * @evidence contracts/common.md#principled-implementation Whole-arm thorax-relative goals resolve after the scapular parent transports the glenohumeral centre, using a registered source shoulder contract and neutral.
 * @evidence contracts/common.md#clear-and-simple-design Thorax identity, joint frame and optional internal axes keep girdle carry and arm-goal authority visible to the graph resolver.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source-specific reach and neutral values remain qualified inputs rather than invented universal clinical bounds; local and public authorities cannot overlap.
 * @evidence contracts/common.md#meaningful-documentation Fields distinguish total TT goals, transported GH centre, preceding thorax frame, source neutral and alternative local axes.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The humerothoracic record declares required frames without running shoulder inverse kinematics.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Optional internal axes describe an alternative authority and do not share a cached public-shoulder result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Shoulder contracts referenced by this interface carry no owned solver session or animation task.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySourceHumerothoracicJoint {
  /** Existing total arm TT coordinates, resolved after the actual girdle. */
  kind: "humerothoracic";

  /** Shared neutral GH centre; it is transported by the actual scapular parent. */
  frame: IAutoMovieHumanBodyBoneWorldRest;

  /** Anatomical thorax bone whose current frame defines the goal frame. */
  thorax: AutoMovieHumanBodyBoneId;

  /** Source-specific public rest and reach, without inventing new universal clinical bounds. */
  contract: IAutoMovieHumanBodyShoulderContract;

  /** Source public neutral updated by the shape registration owner. */
  neutral: IAutoMovieHumanBodyShoulderPose;

  /** Optional source GH coordinates for explicit internal motion. They share frame and cannot simultaneously claim a public TT goal. */
  localAxes?: readonly IAutoMovieHumanBodySourceJointAxis[];
}
