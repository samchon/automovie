import type { AutoMovieHumanBodySide } from "../../identity/AutoMovieHumanBodySide";
import type { IAutoMovieHumanBodyBoneWorldRest } from "../../../structures/rig/IAutoMovieHumanBodyBoneWorldRest";
import type { IAutoMovieHumanBodySourceJointAxis } from "./IAutoMovieHumanBodySourceJointAxis";

/** A proximal source phalanx composes its ray motion on the foot's shared aggregate MTP frame in one graph evaluation. */
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
