import {
  type IAutoMovieHumanBodyBuild,
  type IAutoMovieHumanBodyShoulderPose,
  humanBodyShoulderPoseFromDirection,
} from "@automovie/human";
import { Quaternion, Vector3 } from "@automovie/engine";

/**
 * Read TT rest from the same shaped skeleton the actual builder resolved.
 * Its bones[].rest comes from resolveHumanBodyBuildPose's rest map, also read
 * by the shoulder resolver. No fixed joint metadata or landmark guess replaces
 * those frames. The output contains fresh records for the two named humeri.
 *
 * @evidence contracts/common.md#principled-implementation The real sampler shares the resolver's direction owner and its shaped rest frame authority.
 * @evidence contracts/common.md#clear-and-simple-design One bone scan selects the named humeri and delegates the direction readout.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No shape/preset default replaces the supplied builder result.
 * @evidence contracts/common.md#meaningful-documentation States the exact rest-map source and owned output records.
 */
export function readBodyCorrectiveShoulderRest(
  built: Pick<IAutoMovieHumanBodyBuild, "bones">,
): IAutoMovieHumanBodyShoulderPose[] {
  const rests: IAutoMovieHumanBodyShoulderPose[] = [];
  for (const bone of built.bones)
    if (bone.bone === "leftUpperArm" || bone.bone === "rightUpperArm")
      rests.push(humanBodyShoulderPoseFromDirection({
        bone: bone.bone,
        direction: Quaternion.rotateVector(bone.rest.rotation, Vector3.create(0, 1, 0)),
      }));
  return rests;
}
