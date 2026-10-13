import { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

/**
 * One planted-foot stance run the pass detected and pinned: the foot stayed on
 * the ground from `start` to `end` and its world position was held at
 * `position` (its `y` snapped to the ground plane).
 *
 * @author Samchon
 */
export interface IAutoMovieFootPlant {
  /** The planted foot bone. */
  foot: AutoMovieHumanoidBone;
  /** Inclusive stance-run start, seconds. */
  start: number;
  /** Inclusive stance-run end, seconds. */
  end: number;
  /** Pinned world foot position held across the run (`y` = ground height). */
  position: IAutoMovieVector3;
}
