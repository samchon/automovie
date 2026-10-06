import type { AutoMovieHumanBodySide } from "../../identity/AutoMovieHumanBodySide";
import type { AutoMovieHumanBodyBoneId } from "../../identity/AutoMovieHumanBodyBoneId";
import type { IAutoMovieHumanBodyBoneWorldRest } from "../../../structures/rig/IAutoMovieHumanBodyBoneWorldRest";
import type { IAutoMovieHumanBodySourcePublicPoseJoint } from "./IAutoMovieHumanBodySourcePublicPoseJoint";

/** One foot's existing aggregate MTP motion frame; it is a goal frame, not an extra anatomical bone or metatarsal carrier. */
export interface IAutoMovieHumanBodySourceToeBase {
  /** One common definition per anatomical side. */
  side: AutoMovieHumanBodySide;
  /** Actual foot source bone carrying the aggregate MTP rest frame. */
  parent: AutoMovieHumanBodyBoneId;
  /** Registered public toes rest origin/orientation in canonical metres. */
  rest: IAutoMovieHumanBodyBoneWorldRest;
  /** Actual existing left/rightToes clinical conversion; individual ray motion is excluded. */
  goal: Pick<IAutoMovieHumanBodySourcePublicPoseJoint, "bone" | "axes" | "restFrame" | "supportedAxes">;
  /** Common pivot registration and acquisition/authoring account, without a clinical centre claim. */
  account: string;
}
