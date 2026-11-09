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
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (The same articulated tree held from another segment: every joint on the path from the old root to the new one is inverted, so the new root is the fixed base of a fixed-pivot solve and the old root moves through the inverted joints) and documents parameters `profile`, `root`, the returned value as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (The same articulated tree held from another segment: every joint on the path from the old root to the new one is inverted, so the new root is the fixed base of a fixed-pivot solve and the old root moves through the inverted joints) directly over its typed inputs (`profile`, `root`) as nested iteration of depth 2 (map over profile.joints; some over profile.segments; for loop bounded by parentOf.has(bone)), delegating to `parentOf.has`, `parentOf.get`, `inverted.add`, `inverted.has`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 36 lines and 6 top-level statements that reuses `parentOf.has`, `parentOf.get`, `inverted.add`, `inverted.has` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 1 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `profile`, `root`; the dominant cost is nested iteration of depth 2 (map over profile.joints; some over profile.segments; for loop bounded by parentOf.has(bone)), performed once per call with 7 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 7 allocation sites become the returned value or die with the call, so nothing grows.
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
