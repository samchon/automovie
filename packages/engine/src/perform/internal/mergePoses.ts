import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieTransform,
} from "@automovie/interface";

/*
 * Union a nonempty list of admitted same-skeleton poses by bone with later
 * joints winning. Bone order follows first appearance, root is the last
 * non-null value, and the first pose supplies skeleton identity. Returned
 * joint/root objects are borrowed.
 */
export function mergePoses(poses: IAutoMoviePose[]): IAutoMoviePose {
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
}
