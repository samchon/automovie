import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieSubjectBox } from "./IAutoMovieSubjectBox";

/**
 * The box one staged point occupies, given the vertical extent of what stands
 * there. `extent` is stated relative to the point and carries its own floor, so
 * a model whose geometry begins above its node origin is boxed where it draws
 * rather than at the placement it hangs from.
 *
 * Horizontally degenerate, because a placement is a point and a height is not a
 * width. This is the shape of a subject nothing could be measured for — a node
 * with no compiled model, whose span is its rig's or the stand-in's, and neither
 * of those states a horizontal extent any more than it states a floor. A subject
 * that does draw geometry is boxed by {@link nodeSubjectBox} from what it draws.
 */
export const pointSubjectBox = (
  point: IAutoMovieVector3,
  extent: { min: number; max: number },
): IAutoMovieSubjectBox => ({
  min: { x: point.x, y: point.y + extent.min, z: point.z },
  max: { x: point.x, y: point.y + extent.max, z: point.z },
});
