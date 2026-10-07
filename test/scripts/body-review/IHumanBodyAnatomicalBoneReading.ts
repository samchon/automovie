import type { AutoMovieHumanBodyBoneId } from "@automovie/human/body/anatomy/identity/AutoMovieHumanBodyBoneId";
import type { IAutoMovieHumanBodyBoneTransform } from "@automovie/human/body/structures/rig/IAutoMovieHumanBodyBoneTransform";

/**
 * One actual anatomical graph key beside its returned world placement pair.
 * The archive retains source identity without converting the pair into a
 * matrix or treating the frame as independently measured bone geometry.
 *
 * @evidence contracts/common.md#principled-implementation Preserves the evaluated map key and the owner's existing rest/posed pair.
 * @evidence contracts/common.md#clear-and-simple-design One named record makes the map entry serializable.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record introduces no placement formula or replacement bone.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes a returned rig frame from anatomical geometry.
 * @evidence contracts/modeling.md#spatial-conventions Inherits metre positions and unit-quaternion rotations in the body's basis frame.
 * @author Samchon
 */
export interface IHumanBodyAnatomicalBoneReading extends IAutoMovieHumanBodyBoneTransform {
  /** Actual anatomical identity used by the evaluated source graph. */
  bone: AutoMovieHumanBodyBoneId;
}
