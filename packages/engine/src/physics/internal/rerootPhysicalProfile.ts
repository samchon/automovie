import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalJointAxis,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
} from "@automovie/interface";

/*
 * The same articulated tree held from another segment: every joint on the path
 * from the old root to the new one is inverted, so the new root is the fixed
 * base of a fixed-pivot solve and the old root moves through the inverted
 * joints.
 *
 * Inverting a joint swaps its parent and child with their frames and mirrors
 * each axis range to `[-maximum, -minimum]`. This is exact for the solvers'
 * coordinates: a relative rotation is `normalize(tan(a_x / 2), tan(a_y / 2),
 * tan(a_z / 2), 1)` and its inverse negates the three vector parts, so the
 * inverted joint's coordinates are the negated originals and every ROM limit is
 * kept.
 * Parameter profile: An admitted fixed-pivot tree.
 * Parameter root: The segment to hold.
 * Returns: The rerooted profile, sharing every unchanged joint and segment.
 */
export function rerootPhysicalProfile(
  profile: IAutoMoviePhysicalProfile,
  root: string,
): IAutoMoviePhysicalProfile {
  const parentOf: Map<string, IAutoMoviePhysicalJoint> = new Map(
    profile.joints.map(
      (joint: IAutoMoviePhysicalJoint): [string, IAutoMoviePhysicalJoint] => [
        joint.child,
        joint,
      ],
    ),
  );
  if (
    !profile.segments.some(
      (s: IAutoMoviePhysicalSegment): boolean => s.bone === root,
    )
  )
    throw new Error(`Unknown physical reroot segment ${root}`);
  const inverted: Set<IAutoMoviePhysicalJoint> = new Set();
  for (let bone: string = root; parentOf.has(bone); ) {
    const joint: IAutoMoviePhysicalJoint = parentOf.get(bone)!;
    inverted.add(joint);
    bone = joint.parent;
  }
  const joints: IAutoMoviePhysicalJoint[] = profile.joints.map(
    (joint: IAutoMoviePhysicalJoint): IAutoMoviePhysicalJoint =>
      inverted.has(joint)
        ? {
            ...joint,
            parent: joint.child,
            child: joint.parent,
            parentFrame: joint.childFrame,
            childFrame: joint.parentFrame,
            axes: joint.axes.map(
              (
                axis: IAutoMoviePhysicalJointAxis,
              ): IAutoMoviePhysicalJointAxis => ({
                ...axis,
                minimum: -axis.maximum,
                maximum: -axis.minimum,
              }),
            ),
          }
        : joint,
  );
  return { ...profile, joints };
}
