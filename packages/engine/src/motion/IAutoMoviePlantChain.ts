import { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * A two-segment chain pinned by its end effector: a leg (hip → knee → ankle) or
 * an arm (shoulder → elbow → hand). The plant solver is limb-agnostic: which
 * bones form the chain is the caller's rig policy, the algebra is not.
 *
 * @author Samchon
 */
export interface IAutoMoviePlantChain {
  /** End-effector bone driven onto the pinned target (foot / hand). */
  effector: AutoMovieHumanoidBone;
  /** Chain-root segment (thigh / upper arm). */
  upper: AutoMovieHumanoidBone;
  /** Mid segment (shin / forearm). */
  lower: AutoMovieHumanoidBone;
}
