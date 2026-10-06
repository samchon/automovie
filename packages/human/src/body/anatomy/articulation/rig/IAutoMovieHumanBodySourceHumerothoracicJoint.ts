import type { IAutoMovieHumanBodyBoneWorldRest } from "../../../structures/rig/IAutoMovieHumanBodyBoneWorldRest";
import type { IAutoMovieHumanBodyShoulderPose } from "../../../structures/IAutoMovieHumanBodyShoulderPose";
import type { IAutoMovieHumanBodyShoulderContract } from "../../../structures/rig/IAutoMovieHumanBodyShoulderContract";
import type { AutoMovieHumanBodyBoneId } from "../../identity/AutoMovieHumanBodyBoneId";
import type { IAutoMovieHumanBodySourceJointAxis } from "./IAutoMovieHumanBodySourceJointAxis";

/** Whole TT arm goal solved after the source girdle carries the GH centre. */
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
