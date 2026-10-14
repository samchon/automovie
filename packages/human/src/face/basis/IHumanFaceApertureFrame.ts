import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceAperturePair } from "./IHumanFaceAperturePair";

/**
 * The oral contact frame and the lip and incisor apertures read in it.
 *
 * @evidence contracts/common.md#principled-implementation measureHumanFaceAperture poses the four registered seam/incisal vertices and projects upper-minus-lower along the shared canonical opening direction.
 * @evidence contracts/common.md#clear-and-simple-design Lip and incisor pairs retain their identities under one oral direction frame before full surface posing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Signed projection is a model measurement convention, not Euclidean gap or a registered clinical protocol; closure gains remain separately measured.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish unit directions and registered lip/incisal trajectories; pair documentation supplies metre gap semantics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record performs no posing; measureHumanFaceAperture owns four-vertex work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type schedules no computation; closure/passage consumers borrow its shared measurements.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no handle; the caller owns its small pair/vector record.
 *
 * @author Samchon
 */
export interface IHumanFaceApertureFrame {
  /** Unit opening direction: basis Y-up made perpendicular to the mandibular axis. */
  up: IAutoMovieVector3;

  /** Unit anterior direction: the mandibular axis crossed with up. */
  forward: IAutoMovieVector3;

  /** Registered vermilion seam pair. */
  lips: IHumanFaceAperturePair;

  /** Registered incisal edge pair. */
  incisors: IHumanFaceAperturePair;
}
