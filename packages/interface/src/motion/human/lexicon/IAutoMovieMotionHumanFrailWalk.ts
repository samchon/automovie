import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";

/**
 * The walk of a frail older person (#4009): slow with short steps on a
 * wider base, a long double support, the trunk flexed forward, the arms
 * barely swinging and the feet low over the floor, graded by `severity`
 * from a healthy older adult's walk to a shuffle.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the gait's features and what the grade scales.
 * @evidence contracts/development/design.md#principled-representation The walk's own destination and one dimensionless grade.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The members `frailWalk` reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No speed, step or angle is typed; the grade selects each from its cited range.
 */
export interface IAutoMovieMotionHumanFrailWalk {
  /** Where the walk ends, world metres. */
  to: IAutoMovieVector3;

  /** Floor points passed on the way, world metres; none when absent. */
  via?: IAutoMovieVector3[];

  /**
   * How frail the walk is, from 0, the ordinary walk, to 1, a shuffle;
   * 0.5 when absent.
   * Unit: "1". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
   */
  severity?: number;

  /** How it is performed; neutral when absent. */
  manner?: IAutoMovieMotionManner;
}
