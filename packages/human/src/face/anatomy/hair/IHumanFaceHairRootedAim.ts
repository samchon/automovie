import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One rooted-stem station's escape request to `aimHumanFaceHairRootedStem`.
 *
 * `normal` is the actual outward normal of the skin at the station and
 * `blocking` the actual outward normal of the surface a trial chord would
 * reach first; both are unit head-frame directions read from the same closed
 * collider. `before` is the previous chord's unit direction and `step` the
 * station's nominal chord in metres, whose construction turn bounds the aim
 * for every trial at that station.
 *
 * @author Samchon
 */
export interface IHumanFaceHairRootedAim {
  /** Unit direction of the previous stem chord. */
  before: IAutoMovieVector3;

  /** Unit outward skin normal at the current station. */
  normal: IAutoMovieVector3;

  /** Unit outward normal of the surface a trial chord would reach first. */
  blocking: IAutoMovieVector3;

  /** The station's nominal chord in metres; its construction turn bounds the aim. */
  step: number;
}
