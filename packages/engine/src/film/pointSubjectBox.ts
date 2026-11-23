import {
  type IAutoMoviePointSubjectBox,
  IAutoMovieSubjectBox,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * The box one staged point occupies, given the vertical extent of what stands
 * there.
 *
 * `extent` is in metres relative to the point and carries its own floor, so a
 * subject whose span begins above its node origin is boxed where it is rather
 * than at the placement it hangs from. The box is horizontally degenerate,
 * because a placement is a point and a height is not a width: this is the shape
 * of a subject nothing could be measured for, a node with no compiled model
 * whose span is its rig's or the stand-in's. {@link nodeSubjectBox} boxes a
 * subject with horizontal geometry from its measured extent; its zero-width
 * shape test also routes measured vertical segments here without distinguishing
 * them from unmeasured stand-ins.
 *
 * @param point World point the subject stands at, in metres.
 * @param extent Vertical span relative to `point`, in metres.
 * @returns A new world box, zero wide on X and Z.
 */
export function pointSubjectBox(
  point: IAutoMovieVector3,
  extent: IAutoMoviePointSubjectBox.IExtent,
): IAutoMovieSubjectBox {
  return {
    min: { x: point.x, y: point.y + extent.min, z: point.z },
    max: { x: point.x, y: point.y + extent.max, z: point.z },
  };
}
