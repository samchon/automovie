import type { IAutoMovieHumanPair } from "../common/IAutoMovieHumanPair";
import type { IAutoMovieHumanEyePose } from "./IAutoMovieHumanEyePose";
import type { IAutoMovieHumanJawPose } from "./IAutoMovieHumanJawPose";

/** Articulations within the head: the gaze of each eye, then the jaw. The head's own orientation belongs to the neck. */
export interface IAutoMovieHumanHeadPose {
  /** Gaze of each eye. */
  eyes?: IAutoMovieHumanPair<IAutoMovieHumanEyePose>;

  /** Temporomandibular joints. */
  jaw?: IAutoMovieHumanJawPose;
}
