import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceAperturePair } from "./IHumanFaceAperturePair";

/**
 * The oral contact frame and the lip and incisor apertures read in it.
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
