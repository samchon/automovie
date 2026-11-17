import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";

/**
 * Orthonormal clinical flexion, abduction and twist axes in a bone's rest frame. Runtime construction and admission remain with AutoMovieHumanSkeletonMath in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes orthonormal clinical flexion, abduction and twist axes in a bone's rest frame; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Orthonormal clinical flexion, abduction and twist axes in a bone's rest frame. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanSkeletonMath; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing SkeletonMath contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanSkeletonMath {
  /** Three orthonormal clinical axes of one bone in its rest frame.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Three orthonormal clinical axes of one bone in its rest frame.
   * @evidence contracts/development/design.md#principled-representation `flexion`: Axis flexion turns about. `abduction`: Axis abduction turns about. `twist`: Axis twist turns about, the long axis.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanSkeletonMath.boneAxes. Also types AutoMovieHumanJointTurn.axes, AutoMovieHumanPreparedKinematics.a.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `flexion`, `abduction`, `twist`; callers supply the complete record.
   */
  export interface IAxes {
    /** Axis flexion turns about. */
    flexion: AutoMovieVector3Tuple;

    /** Axis abduction turns about. */
    abduction: AutoMovieVector3Tuple;

    /** Axis twist turns about, the long axis. */
    twist: AutoMovieVector3Tuple;
  }
}
