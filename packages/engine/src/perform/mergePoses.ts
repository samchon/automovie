import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieTransform,
} from "@automovie/interface";

/**
 * Union a nonempty list of admitted same-skeleton poses by bone with later joints winning. Bone order follows first appearance, root is the last non-null value, and the first pose supplies skeleton identity. Returned joint/root objects are borrowed.
 *
 * @evidence contracts/common.md#principled-implementation A bone-keyed insertion-ordered Map performs whole-joint replacement, preserving null axes on an overriding joint rather than merging individual controls.
 * @evidence contracts/common.md#clear-and-simple-design This primitive owns last-wins union; weighted composition has a separate blendPoses owner and timeline assembly decides which one its semantics require.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No ROM clamp or null-axis repair hides an authored override; callers must supply compatible validated poses.
 * @evidence contracts/common.md#meaningful-documentation Documents nonempty/same-skeleton premises, whole-joint precedence, stable order and borrowed nested ownership.
 * @evidence contracts/performance.md#efficient-algorithms For J total joints and P poses, O(P+J) time and O(B) map/output storage for B distinct bones; every joint must participate in precedence.
 * @evidence contracts/performance.md#reuse-equivalent-work Borrowed joint/root values are reused because union does not alter them; one Map entry per bone replaces earlier values without pose rebaking.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned pose/array, borrowed nested values remain input-owned, and the temporary map is released without retained tasks or handles.
 */
export const mergePoses: (poses: IAutoMoviePose[]) => IAutoMoviePose = (
  poses: IAutoMoviePose[],
): IAutoMoviePose => {
  if (poses.length === 0) throw new Error("merge poses must not be empty");

  const joints: Map<AutoMovieHumanoidBone, IAutoMovieJointPose> = new Map<
    AutoMovieHumanoidBone,
    IAutoMovieJointPose
  >();
  let root: IAutoMovieTransform | null = poses[0]!.root;
  for (const pose of poses) {
    if (pose.root !== null) root = pose.root;
    for (const joint of pose.joints) joints.set(joint.bone, joint);
  }
  return {
    skeleton: poses[0]!.skeleton,
    root,
    joints: [...joints.values()],
  };
};
