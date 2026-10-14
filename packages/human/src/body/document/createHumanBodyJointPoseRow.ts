import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
} from "@automovie/interface";

/**
 * One joint row of a body document's pose from the clinical angles that are set.
 *
 * Angles are clinical degrees; null leaves an axis unspecified. The body builder resolves a fresh document against its rest/neutral conventions rather than promising to retain a previous interactive pose. Editor presets and review states share this row constructor, while document admission and the compiled basis judge identities, finite values and ranges.
 *
 * @evidence contracts/common.md#principled-implementation The requested bone and clinical degree/null axes are copied unchanged into the shared joint-pose representation, with omitted abduction/twist represented by null.
 * @evidence contracts/common.md#clear-and-simple-design One small row constructor keeps preset and document producers on the same existing pose schema without evaluating geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Construction performs no finite/range or clinical admission and null cannot promise persistence of a prior performed body.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes unspecified axes, fresh rest/neutral resolution and the document/basis owners of admission.
 * @evidence contracts/performance.md#efficient-algorithms Fixed four-field construction takes constant work and does not traverse a basis or solve a joint.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared presets use this one field mapping; a cache would add identity retention without avoiding meaningful computation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Each returned row owns its scalar fields and retains no basis, pose history, geometry buffer or task.
 *
 * @author Samchon
 */
export function createHumanBodyJointPoseRow(
  bone: AutoMovieHumanoidBone,
  flexion: number | null,
  abduction: number | null = null,
  twist: number | null = null,
): IAutoMovieJointPose {
  return { bone, flexion, abduction, twist };
}
