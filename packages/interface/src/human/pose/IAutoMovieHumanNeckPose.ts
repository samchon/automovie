import type { IAutoMovieHumanAtlantoAxialPose } from "./IAutoMovieHumanAtlantoAxialPose";
import type { IAutoMovieHumanAtlantoOccipitalPose } from "./IAutoMovieHumanAtlantoOccipitalPose";
import type { IAutoMovieHumanCervicalPose } from "./IAutoMovieHumanCervicalPose";

/**
 * The cranio-vertebral joints and the lower cervical spine, top to bottom. Positive flexion bends forward (negative is extension), positive lateral flexion bends toward the person's left and positive rotation turns the face toward the left.
 *
 * Totals follow the AAOS cervical norms (flexion 45, extension 45, lateral flexion 45, rotation 60); the atlanto-occipital and atlanto-axial ranges are White and Panjabi 1990 values (recalled) and the lower cervical region takes the rest.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cranio-vertebral joints and the lower cervical spine, top to bottom.
 * @evidence contracts/development/design.md#principled-representation `atlantoOccipital`: Skull on C1: the nod. `atlantoAxial`: C1 on C2: head rotation. `cervical`: C2 to C7.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanNeckPose is the canonical exchange used by IAutoMovieHumanNeckPoseSchema, IAutoMovieHumanPose.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `atlantoOccipital`: Skull on C1: the nod. `atlantoAxial`: C1 on C2: head rotation. `cervical`: C2 to C7.
 */
export interface IAutoMovieHumanNeckPose {
  /** Skull on C1: the nod. */
  atlantoOccipital?: IAutoMovieHumanAtlantoOccipitalPose;

  /** C1 on C2: head rotation. */
  atlantoAxial?: IAutoMovieHumanAtlantoAxialPose;

  /** C2 to C7. */
  cervical?: IAutoMovieHumanCervicalPose;
}
