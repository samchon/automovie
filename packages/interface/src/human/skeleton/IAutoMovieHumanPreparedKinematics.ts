import type { IAutoMovieHumanPose } from "../pose/IAutoMovieHumanPose";
import type { IAutoMovieHumanPoseProjection } from "./IAutoMovieHumanPoseProjection";

/**
 * Type contracts exchanged by AutoMovieHumanPreparedKinematics; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanPreparedKinematics exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups ISelection, IPrepared. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanPreparedKinematics; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the ISelection, IPrepared contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanPreparedKinematics {
  /** A body-local selection retains requested outputs and every required ancestor.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A body-local selection retains requested outputs and every required ancestor.
   * @evidence contracts/development/design.md#principled-representation `work`: Parent-before-child calculation population, including girdle dependencies. `output`: Requested placement identities; ancestors need not escape the kernel.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanSkeleton.selection.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `work`, `output`; callers supply the complete record.
   */
  export interface ISelection {
    /** Parent-before-child calculation population, including girdle dependencies. */
    work: readonly number[];

    /** Requested placement identities; ancestors need not escape the kernel. */
    output: ReadonlySet<string>;
  }

  /** Explicit body lifetime; no input poses or public output arrays are retained.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Explicit body lifetime; no input poses or public output arrays are retained.
   * @evidence contracts/development/design.md#principled-representation `evaluate`: Read every clinical channel and return independent placements and clamp rows. `select`: Compile and admit a nonempty fixed set of existing bone identities once.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanPreparedKinematics.prepare. Also types AutoMovieHumanSkeleton.kinematics.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `evaluate`, `select`; callers supply the complete record.
   */
  export interface IPrepared {
    /**
     * Read every clinical channel and return fresh placement arrays and clamp rows. clamp applies clinical limits; omitted selection returns every bone, while a supplied selection must come from this same prepared body and remain unchanged.
     */
    evaluate: (
      pose: IAutoMovieHumanPose,
      clamp: boolean,
      selection?: ISelection,
    ) => IAutoMovieHumanPoseProjection;

    /**
     * Compile a nonempty list of existing bone identities into a selection for this prepared body, deduplicating outputs and retaining ancestors in parent-first order. Empty or unknown identities throw.
     */
    select: (bones: readonly string[]) => ISelection;
  }
}
