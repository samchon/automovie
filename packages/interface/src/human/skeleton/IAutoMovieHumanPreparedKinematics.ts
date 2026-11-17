import type { IAutoMovieHumanPose } from "../pose/IAutoMovieHumanPose";
import type { IAutoMovieHumanSkeleton } from "./IAutoMovieHumanSkeleton";

/** Type contracts exchanged by AutoMovieHumanPreparedKinematics; runtime evaluation remains in Human. */
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
    /** Read every clinical channel and return independent placements and clamp rows. */
    evaluate: (
      pose: IAutoMovieHumanPose,
      clamp: boolean,
      selection?: ISelection,
    ) => IAutoMovieHumanSkeleton.IProjection;

    /** Compile and admit a nonempty fixed set of existing bone identities once. */
    select: (bones: readonly string[]) => ISelection;
  }
}
