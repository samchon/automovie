import type { IAutoMovieHumanParameters } from "../IAutoMovieHumanParameters";
import type { AutoMovieHumanPoseProjectionEvaluator } from "./AutoMovieHumanPoseProjectionEvaluator";
import type { IAutoMovieHumanSkeleton } from "./IAutoMovieHumanSkeleton";

/** One body's clinical evaluator. Each full evaluation owns fresh bone, placement
 * and clamp records. The optional foot surface is a shared frozen snapshot.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Evaluates a body's clinical pose and distinguishes fresh mutable pose records from the optional shared frozen foot-surface snapshot.
 * @evidence contracts/development/design.md#principled-representation `project`: Compile exact existing output bones and their dependencies once.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanSkeleton.prepare. Also types AutoMovieHumanSkeleton.evaluate.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `project`: Compile exact existing output bones and their dependencies once.
 */
export interface IAutoMovieHumanPoseEvaluator {
  /** Evaluate all bones, bind data, clamps and requested exterior snapshots. Omitted pose is neutral ({}); omitted clamp is true. */
  (
    pose?: NonNullable<IAutoMovieHumanParameters["pose"]>,
    clamp?: boolean,
  ): IAutoMovieHumanSkeleton.IOutput;

  /**
   * Compile exact existing output bones and their dependencies once. Empty selections and absent bone names throw; custom evaluators may omit this capability.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Compile exact existing output bones and their dependencies once. Empty selections and absent bone names throw; custom evaluators may omit this capability.
   */
  project?: (bones: readonly string[]) => AutoMovieHumanPoseProjectionEvaluator;
}
