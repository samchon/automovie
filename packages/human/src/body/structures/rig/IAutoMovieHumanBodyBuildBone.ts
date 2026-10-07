import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IAutoMovieHumanBodyBoneTransform } from "./IAutoMovieHumanBodyBoneTransform";

/**
 * One named humanoid bone's paired world placements in an evaluated body.
 * Its identity accompanies the existing transform pair for rig inspection
 * and person transport; it does not turn a rig frame into bone geometry.
 *
 * @evidence contracts/common.md#principled-implementation Adds the actual humanoid identity to the existing rest/posed transform carrier without copying a placement formula.
 * @evidence contracts/common.md#clear-and-simple-design One named evaluated-bone record supplies identity and the inherited pair.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The humanoid bone ID accompanies the inherited rest/posed pair; a rig frame is not represented as an independently imaged bone solid.
 * @evidence contracts/common.md#meaningful-documentation States inspection/transport use and the distinction from generated anatomy.
 * @evidence contracts/modeling.md#part-identity-and-grouping Names the existing rig bone; no anatomical solid is inferred.
 * @evidenceExclude contracts/modeling.md#parameter-channels Pose and shape owners supply the placements.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no primitive.
 * @evidence contracts/modeling.md#spatial-conventions Inherited rest/posed world positions are metres and rotations unit quaternions in the right-handed +Y-up, +Z-anterior, +X-left body basis frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Surface and person assembly owners consume the pair.
 * @evidenceExclude contracts/modeling.md#rendered-observation The consuming rig/body assembly observes the result.
 * @evidence contracts/anatomy.md#anatomical-source The bone identity denotes a source humanoid rig frame, not an imaged anatomical solid or measured personal articular centre; inherited placement retains the rig owner's qualification.
 * @evidenceExclude contracts/anatomy.md#permitted-range The pose owner admits the evaluated transforms.
 * @evidence contracts/anatomy.md#parametric-authority This evaluated output preserves existing named pose results for inspection and person transport; it introduces no public vertex or matrix authoring.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyBuildBone extends IAutoMovieHumanBodyBoneTransform {
  /** Existing humanoid identity whose world placements are recorded. */
  bone: AutoMovieHumanoidBone;
}
