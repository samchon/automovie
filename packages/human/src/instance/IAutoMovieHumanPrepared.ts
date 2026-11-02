import type { IAutoMovieSkeleton } from "@automovie/interface";

import type { AutoMovieHumanSkeleton } from "../skeleton/AutoMovieHumanSkeleton";
import type { IAutoMovieHumanGenerated } from "../structures/IAutoMovieHumanGenerated";

/**
 * One generated Human prepared for posing: the immutable shape every instance
 * of that person shares.
 *
 * `AutoMovieHuman.prepare` returns it. The model is at the bind, the posture
 * the skin was generated in, and carries no pose: `parameters.pose` and
 * `parameters.expression` are the initial state an instance takes, applied
 * once by that instance and never baked into the shape, so no update can
 * apply them a second time. The model and skeleton are shared by every
 * instance and every consumer reads them only; nothing in this package
 * mutates them after preparation. Freezing is not used because the vertex
 * arrays run to millions of numbers.
 */
export interface IAutoMovieHumanPrepared extends IAutoMovieHumanGenerated {
  /** The rig the model carries, `model.skeleton`, its rest at the bind. */
  skeleton: IAutoMovieSkeleton;

  /**
   * The prepared clinical evaluator of this body, from the same calibration
   * the skin was lofted from. It holds the neutral skeleton and axes, so a
   * pose costs forward kinematics alone and never calibrates the body again.
   */
  evaluate: AutoMovieHumanSkeleton.PoseEvaluator;

  /**
   * Canonical text of every shape field (all parameters except pose and
   * expression), sorted by key. Two preparations with equal keys generate the
   * same shape, because generation is a function of those fields alone.
   */
  key: string;
}
