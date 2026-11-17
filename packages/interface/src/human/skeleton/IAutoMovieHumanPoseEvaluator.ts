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
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or compensations execute in this signature. AutoMovieHumanSkeleton and the callback provider must satisfy the documented project contract.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no algorithm or storage strategy; AutoMovieHumanSkeleton and its callback provider own the cost of each project invocation.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no requests or caching. AutoMovieHumanSkeleton and the callback provider determine when the inputs to project describe equivalent work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources. AutoMovieHumanSkeleton and the callback provider own any captured source data and the callable's lifetime.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This is the IAutoMovieHumanPoseEvaluator.project callable contract, without an implementation body. AutoMovieHumanSkeleton and its supplied callbacks own the numerical method and admission of the documented arguments.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanPoseEvaluator.project declares only the invocation boundary; decomposition belongs to AutoMovieHumanSkeleton and the callback provider.
   */
  project?: (bones: readonly string[]) => AutoMovieHumanPoseProjectionEvaluator;
}
