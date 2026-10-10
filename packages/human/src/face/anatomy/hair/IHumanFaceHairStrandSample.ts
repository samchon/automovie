import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One interpolated strand before placement on its canonical stem.
 *
 * Points are head-frame metres along the interpolated strand, `length` is its
 * metric target and `normal` the root surface normal it was interpolated
 * with. Placement projects only the stations beyond the stem.
 *
 * @author Samchon
 */
export interface IHumanFaceHairStrandSample {
  /** Interpolated stations, root first. */
  points: readonly IAutoMovieVector3[];

  /** Metric target length of the strand, in metres. */
  length: number;

  /** Root surface normal the strand was interpolated with. */
  normal: IAutoMovieVector3;
}
