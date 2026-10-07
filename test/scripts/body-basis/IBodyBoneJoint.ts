import type { AutoMovieHumanoidBone } from "@automovie/interface";

/** A source joint and its parent, in the skin owner's declared ordering. */
export interface IBodyBoneJoint {
  bone: AutoMovieHumanoidBone;
  parent: AutoMovieHumanoidBone | null;
}
