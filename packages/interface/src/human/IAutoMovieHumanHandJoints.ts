import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanHandFrame } from "./IAutoMovieHumanHandFrame";

/** The joints the metacarpals end at, in the left frame. */
export interface IAutoMovieHumanHandJoints {
  /** The thumb's carpometacarpal joint. */
  cmc: AutoMovieVector3Tuple;

  /** Each digit's metacarpophalangeal joint, thumb first. */
  mcps: AutoMovieVector3Tuple[];

  /** The hand's frame on its knuckles, once the fingers' lines have placed them. */
  frame?: IAutoMovieHumanHandFrame;
}
