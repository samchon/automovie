import { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/** A live bone on a rigged staged actor, resolved on the shot clock. */
export interface IAutoMovieBoneTarget {
  /** Selects a live skeleton bone as the target representation. */
  kind: "bone";

  /** Staged actor node carrying the rig. */
  node: string;

  /** Bone on that actor's declared skeleton. */
  bone: AutoMovieHumanoidBone;
}
