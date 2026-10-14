import { IAutoMovieTransform, IAutoMovieVector3 } from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/**
 * Apply one TRS transform to a point: scale per axis, then rotate, then translate, the order a renderer applies a node's transform in.
 *
 * Exported because the same arithmetic places a model's parts for measurement in `computeModelRestExtent` and carries a measured model box out into the world a camera frames it in through {@link nodeSubjectBox}. A second copy is how the box a shot is graded against comes to disagree with the box it was solved from. The rotation is used as given, so a non-unit quaternion distorts the point rather than rotating it.
 *
 * @param transform The transform to apply.
 * @param point The point in the transform's local frame.
 * @returns A new point in the parent frame.
 *
 * @evidence contracts/common.md#principled-implementation The affine map `T + R(S·p)`, the composition order of glTF and `three.js` node transforms, evaluated with a quaternion rotation instead of a composed matrix; it relies on a unit rotation, which staging and model validation require.
 * @evidence contracts/common.md#clear-and-simple-design One placement rule shared by model-extent measurement and node subject boxes, so a part is placed for measurement exactly as its box is later placed in the world.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Applies every transform the same way with no special case for an identity or a uniform scale.
 * @evidence contracts/common.md#meaningful-documentation States the order of operations, who shares it and why one copy matters, the non-unit rotation effect, and the frames of input and output.
 * @evidence contracts/performance.md#efficient-algorithms Constant time: three multiplications, one quaternion rotation and one addition, with no matrix built.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of one transform and one point that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates two temporary vectors and retains nothing; the caller owns the returned point.
 */
export function placeTransformedPoint (
  transform: IAutoMovieTransform,
  point: IAutoMovieVector3,
): IAutoMovieVector3 { return Vector3.add(
    transform.translation,
    Quaternion.rotateVector(transform.rotation, {
      x: point.x * transform.scale.x,
      y: point.y * transform.scale.y,
      z: point.z * transform.scale.z,
    }),
  ); }
