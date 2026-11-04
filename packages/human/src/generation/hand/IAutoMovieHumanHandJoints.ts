import type { IAutoMovieHumanHandFrame } from "./IAutoMovieHumanHandFrame";
import type { AutoMovieHumanHandVector } from "./AutoMovieHumanHandVector";

type Vec3 = AutoMovieHumanHandVector.Vec3;

/** The joints the metacarpals end at, in the left frame. */
export interface IAutoMovieHumanHandJoints {
  /** The thumb's carpometacarpal joint. */
  cmc: Vec3;

  /** Each digit's metacarpophalangeal joint, thumb first. */
  mcps: Vec3[];

  /** The hand's frame on its knuckles, once the fingers' lines have placed them. */
  frame?: IAutoMovieHumanHandFrame;
}
