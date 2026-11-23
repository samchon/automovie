import type { IAutoMovieHumanAtlantoAxialPose } from "./IAutoMovieHumanAtlantoAxialPose";
import type { IAutoMovieHumanAtlantoOccipitalPose } from "./IAutoMovieHumanAtlantoOccipitalPose";
import type { IAutoMovieHumanCervicalPose } from "./IAutoMovieHumanCervicalPose";

/**
 * The cranio-vertebral joints and the lower cervical spine, top to bottom. Positive flexion bends forward (negative is extension), positive lateral flexion bends toward the person's left and positive rotation turns the face toward the left.
 *
 * Totals follow the AAOS cervical norms (flexion 45, extension 45, lateral flexion 45, rotation 60); the atlanto-occipital and atlanto-axial ranges are White and Panjabi 1990 values (recalled) and the lower cervical region takes the rest.
 */
export interface IAutoMovieHumanNeckPose {
  /** Skull on C1: the nod. */
  atlantoOccipital?: IAutoMovieHumanAtlantoOccipitalPose;

  /** C1 on C2: head rotation. */
  atlantoAxial?: IAutoMovieHumanAtlantoAxialPose;

  /** C2 to C7. */
  cervical?: IAutoMovieHumanCervicalPose;
}
