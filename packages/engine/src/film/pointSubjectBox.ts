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
 *
 * @evidence requirements/asset-authoring/representations-bounds-and-lod.md#asset-bounds-state-motion pointSubjectBox exposes state-dependent asset extent: The box one staged point occupies, given the vertical extent of what stands there, carrying the extent's own floor so geometry authored above its node origin is boxed where it draws. Horizontally degenerate, because this is the shape of a subject nothing could be measured for: a rig span and the stand-in height state no width any more than they state a floor.
 * @evidence specifications/asset-and-representation/bounds-proxies-and-lod.md#asset-spec-dynamic-bounds-invariants pointSubjectBox realizes dynamic-bounds invariants: The box one staged point occupies, given the vertical extent of what stands there, carrying the extent's own floor so geometry authored above its node origin is boxed where it draws. Horizontally degenerate, because this is the shape of a subject nothing could be measured for: a rig span and the stand-in height state no width any more than they state a floor.
 */
export const pointSubjectBox = (
  point: IAutoMovieVector3,
  extent: { min: number; max: number },
): IAutoMovieSubjectBox => ({
  min: { x: point.x, y: point.y + extent.min, z: point.z },
  max: { x: point.x, y: point.y + extent.max, z: point.z },
});
