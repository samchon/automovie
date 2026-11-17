import type { IAutoMovieHumanPair } from "../IAutoMovieHumanPair";
import type { IAutoMovieHumanEyePose } from "./IAutoMovieHumanEyePose";
import type { IAutoMovieHumanJawPose } from "./IAutoMovieHumanJawPose";

/** Articulations within the head: the gaze of each eye, then the jaw. The head's own orientation belongs to the neck.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Articulations within the head: the gaze of each eye, then the jaw.
 * @evidence contracts/development/design.md#principled-representation `eyes`: Gaze of each eye. `jaw`: Temporomandibular joints.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanHeadPose is the canonical exchange used by IAutoMovieHumanHeadPoseSchema, IAutoMovieHumanPose.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `eyes`: Gaze of each eye. `jaw`: Temporomandibular joints.
 */
export interface IAutoMovieHumanHeadPose {
  /** Gaze of each eye. */
  eyes?: IAutoMovieHumanPair<IAutoMovieHumanEyePose>;

  /** Temporomandibular joints. */
  jaw?: IAutoMovieHumanJawPose;
}
