import {
  IAutoMovieDesignPoint,
  IAutoMovieDesignSourceFrame,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { designFrameScale } from "./designFrameScale";

/** Axes no longer than this threshold are returned without normalization. */
const AXIS_EPSILON: number = 1e-12;

/**
 * Map one source-space point onto world metres through its frame.
 *
 * With `s` the settled metres-per-unit, the point becomes `origin` plus normalized `axisX` times `(x - anchor.x) * s` plus normalized `axisY` times `(y - anchor.y) * s`. Optional placement applies scale, normalized rotation, then translation. Non-orthogonal axes retain their skew. An axis no longer than `1e-12` is used unchanged: only a zero axis removes its coordinate contribution; `validateDesignReference` refuses these short axes. Finite inputs can still overflow intermediate subtraction, length or multiplication, so this mapping does not certify a finite result.
 *
 * Throws an `Error` when the frame's scale is unsettled: producing a number there is the exact failure this whole graph exists to prevent.
 *
 * @param frame Frame the point was read in.
 * @param point Source-space point in the frame's own units.
 * @returns World position in metres.
 *
 * @evidence contracts/common.md#principled-implementation An affine map from the frame's 2D source units into 3D: subtract the anchor, scale by the settled metres-per-unit from `designFrameScale`, span by the normalized axes from the origin, then apply the optional TRS transform in scale, rotation, translation order; skew from non-orthogonal axes is kept, as the documentation states.
 * @evidence contracts/common.md#clear-and-simple-design One function per point that reuses the shared scale lookup and the engine's vector and quaternion helpers rather than local copies.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no frame; an unsettled scale is refused instead of defaulting to one metre per unit.
 * @evidence contracts/common.md#meaningful-documentation States the exact formula, the transform order, why axes are normalized and not orthogonalized, what a zero-length axis does, the units, and the thrown refusal.
 * @evidence contracts/performance.md#efficient-algorithms O(C) for the settled-scale lookup through C candidates, followed by a fixed number of vector and quaternion operations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Coordinates no work across calls; mapping multiple points repeats the candidate lookup for each point, with no bound on candidate count assumed here.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates a few temporary vectors and retains nothing.
 */
export const designReferenceWorldPoint: (
  frame: IAutoMovieDesignSourceFrame,
  point: IAutoMovieDesignPoint,
) => IAutoMovieVector3 = (
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

/** Normalize an axis longer than the threshold; otherwise return it unchanged. */
const unit: (value: IAutoMovieVector3) => IAutoMovieVector3 = (
  value: IAutoMovieVector3,
): IAutoMovieVector3 => {
  const length: number = Math.hypot(value.x, value.y, value.z);
  if (length <= AXIS_EPSILON) return value;
  return { x: value.x / length, y: value.y / length, z: value.z / length };
};
