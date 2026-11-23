import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieJointPose } from "../pose/IAutoMovieJointPose";

/**
 * Contracts of `prepareJointRotationCoefficientDots`: a two-axis joint's coefficient readers.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the dot readers and the swivel proposal with its decline.
 * @evidence contracts/development/design.md#principled-representation Four quaternion dot callables per reference joint and the swivels they propose.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The joint rotation projector's swivel proposer reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Proposals only; angle ranges, clamps and goals are still checked by their owners.
 */
export namespace IAutoMoviePrepareJointRotationCoefficientDots {
  /**
   * One fixed coefficient's four-term dot reader, with its existing finite-input premise.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMoviePrepareJointRotationCoefficientDots.IDot: One fixed coefficient's four-term dot reader, with its existing finite-input premise.
   * @evidence contracts/development/design.md#principled-representation One named type over the canonical IAutoMovieQuaternion contracts, so its readers share one spelling of it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `prepareJointRotationCoefficientDots` fills it and the enclosing IAutoMoviePrepareJointRotationCoefficientDots contract's readers use it; nothing else is declared.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A type contract only: it holds no cached answer, fitted constant or fixture-specific member, and admission and computation stay with `prepareJointRotationCoefficientDots`.
   */
  export type IDot = (target: IAutoMovieQuaternion) => number;
  /**
   * Fixed-rig readers; query inputs are borrowed only until return.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMoviePrepareJointRotationCoefficientDots.IReader: Fixed-rig readers.
   * @evidence contracts/development/design.md#principled-representation One record of its call, swivels over the canonical IAutoMovieJointPose, IAutoMovieQuaternion contracts.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `prepareJointRotationCoefficientDots` fills it and the enclosing IAutoMoviePrepareJointRotationCoefficientDots contract's readers use it; nothing else is declared.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A type contract only: it holds no cached answer, fitted constant or fixture-specific member, and admission and computation stay with `prepareJointRotationCoefficientDots`.
   */
  export interface IReader {
    /** Original four coefficient-dot callables for this fixed null/numeric mode. */
    (reference: IAutoMovieJointPose): readonly IDot[];
    /**
     * Propose degree swivels of q=cosine*cos(psi/2)+sine*sin(psi/2), or decline.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMoviePrepareJointRotationCoefficientDots.IReader.swivels: Propose degree swivels of q=cosine*cos(psi/2)+sine*sin(psi/2), or decline.
     */
    swivels(
      reference: IAutoMovieJointPose,
      cosine: IAutoMovieQuaternion,
      sine: IAutoMovieQuaternion,
    ): readonly number[] | "all" | null;
  }
}
