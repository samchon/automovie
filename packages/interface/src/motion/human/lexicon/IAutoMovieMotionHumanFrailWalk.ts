import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";

/**
 * The walk of a frail older person: slow with short steps on a wider base, a
 * long double support, the trunk flexed forward, the arms barely swinging and
 * the feet low over the floor, graded by `severity` from a healthy older
 * adult's walk to a shuffle.
 */
export interface IAutoMovieMotionHumanFrailWalk {
  /** Where the walk ends, world metres. */
  to: IAutoMovieVector3;

  /** Floor points passed on the way, world metres; none when absent. */
  via?: IAutoMovieVector3[];

  /**
   * The heading faced on arrival, degrees; a turn in place when `to` is where
   * the walker stands. The direction of travel when absent.
   */
  face?: number;

  /**
   * How frail the walk is, from 0, the ordinary walk (about 1.5 m/s at the
   * reference hip), to 1, a shuffle (0.6 m/s, the speed below which an older
   * adult is frail, Studenski et al. 2011); about 1.1 m/s and 0.5 when absent.
   * Each feature runs linearly between the two ends (`HumanFrailWalk`): 0 fits
   * a healthy older adult, about 0.5 a tiring or unsteady one, 1 a weak one who
   * shuffles.
   */
  severity?: number;

  /** How it is performed; neutral when absent. */
  manner?: IAutoMovieMotionManner;
}
