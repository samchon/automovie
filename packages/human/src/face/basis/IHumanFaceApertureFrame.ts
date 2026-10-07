import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceAperturePair } from "./IHumanFaceAperturePair";

/**
 * The oral contact frame and the lip and incisor apertures read in it.
 *
 * @evidence contracts/common.md#principled-implementation Both pairs are read in the same frame, so their gaps compare directly.
 * @evidence contracts/common.md#clear-and-simple-design Two directions and two pairs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The directions follow the declared mandibular axis; no fixed camera frame enters.
 * @evidence contracts/common.md#meaningful-documentation States each direction and pair.
 * @evidence contracts/modeling.md#spatial-conventions Unit directions of the Y-up basis frame and basis-metre pairs.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record names no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record is not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The contact summary reports apertures.
 * @evidenceExclude contracts/anatomy.md#anatomical-source A model convention, not an anatomical frame.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record is not an input.
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
