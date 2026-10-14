import { IAutoMovieSubjectBox, IAutoMovieVector3 } from "@automovie/interface";

/**
 * The box one staged point occupies, given the vertical extent of what stands there.
 *
 * `extent` is in metres relative to the point and carries its own floor, so a subject whose span begins above its node origin is boxed where it is rather than at the placement it hangs from. The box is horizontally degenerate, because a placement is a point and a height is not a width: this is the shape of a subject nothing could be measured for, a node with no compiled model whose span is its rig's or the stand-in's. {@link nodeSubjectBox} boxes a subject with horizontal geometry from its measured extent; its zero-width shape test also routes measured vertical segments here without distinguishing them from unmeasured stand-ins.
 *
 * @param point World point the subject stands at, in metres.
 * @param extent Vertical span relative to `point`, in metres.
 * @returns A new world box, zero wide on X and Z.
 *
 * @evidence contracts/common.md#principled-implementation Offsets the point's Y by the two ends of the vertical span and keeps X and Z, which is the exact box of a vertical segment; it relies on `extent.min <= extent.max`, which `nodeSubjectExtent` guarantees.
 * @evidence contracts/common.md#clear-and-simple-design The degenerate half of node boxing owns the world-vertical stand-in policy; nodeSubjectBox deliberately passes translation alone, even when a measured vertical segment has the same shape.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No width is invented for an unmeasured subject; the box stays zero wide for every caller.
 * @evidence contracts/common.md#meaningful-documentation States the frame and units of both arguments, that the floor is relative, why the box has no width, which subjects reach it, and how it relates to `nodeSubjectBox`.
 * @evidence contracts/performance.md#efficient-algorithms Constant time: two additions and one box literal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure constant-time constructor that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Copies three coordinates into two new corners and keeps no reference to the point or the extent record.
 */
export function pointSubjectBox(
  point: IAutoMovieVector3,
  extent: { min: number; max: number },
): IAutoMovieSubjectBox {
  return {
    min: { x: point.x, y: point.y + extent.min, z: point.z },
    max: { x: point.x, y: point.y + extent.max, z: point.z },
  };
}
