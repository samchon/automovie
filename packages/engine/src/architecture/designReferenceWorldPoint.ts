import {
  IAutoMovieDesignPoint,
  IAutoMovieDesignSourceFrame,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { designFrameScale } from "./designFrameScale";

/** Direction vectors this short or shorter are treated as having no direction. */
const AXIS_EPSILON: number = 1e-12;

/**
 * Map one source-space point onto world metres through its frame.
 *
 * With `s` the settled metres-per-unit, the point becomes `origin` plus the
 * unit `axisX` times `(x - anchor.x) * s` plus the unit `axisY` times
 * `(y - anchor.y) * s`. The frame's optional placement transform is then
 * applied as scale, normalized rotation, and translation, in that order. Axes
 * are normalized here rather than demanded normalized from the author, so a
 * hand-written `{ x: 0, y: 0, z: 2 }` means the direction it plainly means
 * instead of doubling every measurement. The axes are not orthogonalized: two
 * non-parallel, non-perpendicular axes give a skewed map. An axis no longer
 * than `1e-12` is used as given, so it collapses its coordinate onto the
 * origin; `validateDesignReference` refuses such an axis.
 *
 * Throws an `Error` when the frame's scale is unsettled: producing a number
 * there is the exact failure this whole graph exists to prevent.
 *
 * @param frame Frame the point was read in.
 * @param point Source-space point in the frame's own units.
 * @returns World position in metres.
 *
 * @evidence contracts/common.md#principled-implementation An affine map from the frame's 2D source units into 3D: subtract the anchor, scale by the settled metres-per-unit from `designFrameScale`, span by the normalized axes from the origin, then apply the optional TRS transform in scale, rotation, translation order; skew from non-orthogonal axes is kept, as the documentation states.
 * @evidence contracts/common.md#clear-and-simple-design One function per point that reuses the shared scale lookup and the engine's vector and quaternion helpers rather than local copies.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no frame; an unsettled scale is refused instead of defaulting to one metre per unit.
 * @evidence contracts/common.md#meaningful-documentation States the exact formula, the transform order, why axes are normalized and not orthogonalized, what a zero-length axis does, the units, and the thrown refusal.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Constant work per point with no algorithm or data structure to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure map of one point that coordinates no work across calls; a caller mapping many points through one frame pays one candidate lookup each, which is the frame's few candidates.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates a few temporary vectors and retains nothing.
 */
export const designReferenceWorldPoint = (
  frame: IAutoMovieDesignSourceFrame,
  point: IAutoMovieDesignPoint,
): IAutoMovieVector3 => {
  const meters: number | null = designFrameScale(frame);
  if (meters === null)
    throw new Error(
      `design frame "${frame.id}" has no settled scale, so source point (${point.x}, ${point.y}) has no world position.`,
    );
  const x: IAutoMovieVector3 = unit(frame.axisX);
  const y: IAutoMovieVector3 = unit(frame.axisY);
  const dx: number = (point.x - frame.anchor.x) * meters;
  const dy: number = (point.y - frame.anchor.y) * meters;
  const mapped: IAutoMovieVector3 = {
    x: frame.origin.x + x.x * dx + y.x * dy,
    y: frame.origin.y + x.y * dx + y.y * dy,
    z: frame.origin.z + x.z * dx + y.z * dy,
  };
  const transform: IAutoMovieDesignSourceFrame["transform"] = frame.transform;
  if (transform === null) return mapped;
  const rotated: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.normalize(transform.rotation),
    {
      x: mapped.x * transform.scale.x,
      y: mapped.y * transform.scale.y,
      z: mapped.z * transform.scale.z,
    },
  );
  return Vector3.add(rotated, transform.translation);
};

/** The unit direction of an axis, or the axis itself when it has none. */
const unit = (value: IAutoMovieVector3): IAutoMovieVector3 => {
  const length: number = Math.hypot(value.x, value.y, value.z);
  if (length <= AXIS_EPSILON) return value;
  return { x: value.x / length, y: value.y / length, z: value.z / length };
};
