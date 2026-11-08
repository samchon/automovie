import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

/**
 * The same articulated tree held from another segment: every joint on the
 * path from the old root to the new one is inverted, so the new root is the
 * fixed base of a fixed-pivot solve and the old root moves through the
 * inverted joints.
 *
 * Inverting a joint swaps its parent and child with their frames and mirrors
 * each axis range to `[-maximum, -minimum]`. This is exact for the solvers'
 * coordinates: a relative rotation is `normalize(tan(a_x / 2), tan(a_y / 2),
 * tan(a_z / 2), 1)` and its inverse negates the three vector parts, so the
 * inverted joint's coordinates are the negated originals and every ROM limit
 * is kept.
 *
 * @param profile An admitted fixed-pivot tree.
 * @param root The segment to hold.
 * @returns The rerooted profile, sharing every unchanged joint and segment.
 */
export function rerootPhysicalProfile(profile: P, root: string): P {
  const parentOf: Map<string, P.IJoint> = new Map(
    profile.joints.map((joint: P.IJoint): [string, P.IJoint] => [
      joint.child,
      joint,
    ]),
  );
  if (!profile.segments.some((s: P.ISegment): boolean => s.bone === root))
    throw new Error(`Unknown physical reroot segment ${root}`);
  const inverted: Set<P.IJoint> = new Set();
  for (let bone: string = root; parentOf.has(bone); ) {
    const joint: P.IJoint = parentOf.get(bone)!;
    inverted.add(joint);
    bone = joint.parent;
  }
  const joints: P.IJoint[] = profile.joints.map(
    (joint: P.IJoint): P.IJoint =>
      inverted.has(joint)
        ? {
            ...joint,
            parent: joint.child,
            child: joint.parent,
            parentFrame: joint.childFrame,
            childFrame: joint.parentFrame,
            axes: joint.axes.map(
              (axis: P.IAxis): P.IAxis => ({
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
