import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One posed upper/lower midline vertex pair and its signed aperture.
 *
 * @author Samchon
 */
export interface IHumanFaceAperturePair {
  /** Posed upper vertex. */
  upper: IAutoMovieVector3;

  /** Posed lower vertex. */
  lower: IAutoMovieVector3;

  /** Upper minus lower along the opening direction; positive is open, zero sealed. */
  gap: number;
}
