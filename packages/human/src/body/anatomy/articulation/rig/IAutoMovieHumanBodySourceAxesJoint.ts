import type { IAutoMovieHumanBodyBoneWorldRest } from "../../../structures/rig/IAutoMovieHumanBodyBoneWorldRest";
import type { IAutoMovieHumanBodySourceJointAxis } from "./IAutoMovieHumanBodySourceJointAxis";

/** Ordered intrinsic source coordinates around one shared neutral joint frame. */
export interface IAutoMovieHumanBodySourceAxesJoint {
  /** Ordered intrinsic source coordinates with explicitly registered local pivots. */
  kind: "axes";

  /** Shared neutral joint centre and orientation in common body metres. */
  frame: IAutoMovieHumanBodyBoneWorldRest;

  /** Source order is significant; each rotation or translation carries later axes. */
  axes: readonly IAutoMovieHumanBodySourceJointAxis[];
}
